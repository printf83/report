import { vettingResultCsvToArray } from "./process/vettingResult";
import { vettingRequestCsvToArray } from "./process/vettingRequest";
import { csgAttendCsvToArray } from "./process/csgAttend";
import { processResult } from "./process/report";
import { buildTable } from "./process/buildTable";
import { buildLocationMap, locationCsvToArray } from "./process/location";
import { buildCorrectionMap, correctionCsvToArray } from "./process/correction";
import { showModal } from "./modal";
import { getBrowserInfo, saveDate } from "./process/util";
import { toCanvas } from "html-to-image";
import jsPDF from "jspdf";
import { MAX_ROWS_PER_PAGE, TABLE_TITLE_ROWS } from "./const";

export const buildResult = (container, data) => {
	const mapCorrection = new Map();
	const mapLocation = new Map();
	const allLocation = [
		...locationCsvToArray(data.location, import.meta.env.VITE_SOURCE_UC),
		...(data.item
			? data.item.flatMap((i) =>
					locationCsvToArray(i.location, i.company),
				)
			: []),
	];

	buildCorrectionMap(mapCorrection, correctionCsvToArray(data.correction));
	buildLocationMap(mapCorrection, mapLocation, allLocation);

	const table = (data) => {
		const all = processResult({
			company: data.company,
			mapLocation: mapLocation,
			csgAttend: csgAttendCsvToArray(data.csgAttend),
			vettingResult: vettingResultCsvToArray(data.vettingResult),
			vettingRequest: vettingRequestCsvToArray(data.vettingRequest),
		}).sort((a, b) => {
			return (
				a.location.localeCompare(b.location) ||
				b.csg.localeCompare(a.csg) ||
				a.name.localeCompare(b.name)
			);
		});

		return [
			buildTable(data.company, all, all),
			buildTable(
				data.company,
				all.filter((i) => {
					return i.csg.startsWith("HADIR");
				}),
				all,
				"Hadir CSG",
			),
			buildTable(
				data.company,
				all.filter((i) => {
					return i.csg.startsWith("BELUM HADIR");
				}),
				all,
				"Belum CSG",
			),
		];
	};

	const startTimer = performance.now();
	const html = data.item ? data.item.flatMap((d) => table(d)) : [];
	console.log(
		`Prosess siap dalam masa ${(performance.now() - startTimer).toFixed(2)}ms`,
	);

	container.innerHTML = html.join("\n");

	attachHoverEffect(container, "span[data-type]");
	attachGroupTableSort(container, "div.group", {
		tableTitleRows: TABLE_TITLE_ROWS(),
		maxRowsPerPage: MAX_ROWS_PER_PAGE(),
	});
};

const attachHoverEffect = (container, selector) => {
	//add hover effect into span[data-type]
	const elements = container.querySelectorAll(selector);
	if (elements && elements.length > 0) {
		elements.forEach((el) => {
			el.addEventListener("click", () => {
				const group = el.closest("div.group");
				const type = el.dataset.type;

				if (group) {
					if (el.dataset.value !== "true") {
						group.classList.add(type);
						el.dataset.value = "true";
					} else {
						group.classList.remove(type);
						el.dataset.value = "false";
					}
				}
			});
		});
	}
};

export const attachGroupTableSort = (
	container,
	groupSelector,
	options = {},
) => {
	const { tableTitleRows = 10, maxRowsPerPage = 50 } = options;
	const firstPageMaxRows = maxRowsPerPage - tableTitleRows;

	const groups = container.querySelectorAll(groupSelector);

	groups.forEach((group) => {
		const pages = Array.from(group.querySelectorAll(".page"));
		if (pages.length === 0) return;

		// Gather all column headers across tables (they all share the same structure)
		const allThs = group.querySelectorAll("table.output thead th");
		// Get primary set of headers for tracking multi-column sort state
		const primaryThs = pages[0].querySelectorAll("table.output thead th");

		const sortAndRepaginateGroup = () => {
			// 1. Gather active sort configurations
			const sortedHeaders = Array.from(primaryThs)
				.filter(
					(th) =>
						th.hasAttribute("data-sort") &&
						th.hasAttribute("data-sort-index"),
				)
				.map((th) => ({
					columnIndex: Array.from(th.parentNode.children).indexOf(th),
					direction: th.getAttribute("data-sort"),
					priority: parseInt(th.getAttribute("data-sort-index"), 10),
				}))
				.sort((a, b) => a.priority - b.priority);

			if (sortedHeaders.length === 0) return;

			// 2. Extract ALL <tr> elements across all .page tables in this .group
			const allRows = [];
			pages.forEach((page) => {
				const rows = page.querySelectorAll("table.output tbody tr");
				rows.forEach((row) => allRows.push(row));
			});

			// 3. Sort all rows together as one dataset
			allRows.sort((rowA, rowB) => {
				for (const sortInfo of sortedHeaders) {
					const cellA =
						rowA.children[
							sortInfo.columnIndex
						]?.textContent.trim() || "";
					const cellB =
						rowB.children[
							sortInfo.columnIndex
						]?.textContent.trim() || "";

					const comparison = cellA.localeCompare(cellB, undefined, {
						numeric: true,
						sensitivity: "base",
					});

					if (comparison !== 0) {
						return sortInfo.direction === "asc"
							? comparison
							: -comparison;
					}
				}
				return 0;
			});

			// 4. Renumber all rows sequentially across pages
			allRows.forEach((row, globalIdx) => {
				const firstCell = row.querySelector("td");
				if (firstCell) {
					firstCell.textContent = globalIdx + 1;
				}
			});

			// 5. Redistribute sorted rows back into their page containers
			let rowIndex = 0;
			pages.forEach((page, pageIndex) => {
				const tbody = page.querySelector("table.output tbody");
				if (!tbody) return;

				tbody.innerHTML = ""; // Clear current page content

				// Determine capacity for this specific page
				const capacity =
					pageIndex === 0 ? firstPageMaxRows : maxRowsPerPage;
				const pageRows = allRows.slice(rowIndex, rowIndex + capacity);

				pageRows.forEach((row) => tbody.appendChild(row));
				rowIndex += capacity;
			});
		};

		// Synchronize header visual states across all pages in the group
		const syncHeaderAttributes = (targetIndex, sortDir, sortIndex) => {
			pages.forEach((page) => {
				const th = page.querySelectorAll("table.output thead th")[
					targetIndex
				];
				if (!th) return;

				if (sortDir) {
					th.setAttribute("data-sort", sortDir);
					th.setAttribute("data-sort-index", sortIndex);
				} else {
					th.removeAttribute("data-sort");
					th.removeAttribute("data-sort-index");
				}
			});
		};

		// Attach click events to all column headers across all page tables
		allThs.forEach((th) => {
			const columnIndex = Array.from(th.parentNode.children).indexOf(th);
			if (columnIndex === 0) return; // Skip row number column ('Bil')

			th.addEventListener("click", () => {
				const currentSort = th.getAttribute("data-sort");

				if (currentSort === "asc") {
					syncHeaderAttributes(
						columnIndex,
						"desc",
						th.getAttribute("data-sort-index"),
					);
				} else if (currentSort === "desc") {
					const removedIndex = parseInt(
						th.getAttribute("data-sort-index"),
						10,
					);

					// Clear sort on clicked column across all pages
					syncHeaderAttributes(columnIndex, null, null);

					// Re-index remaining sorted headers
					if (!isNaN(removedIndex)) {
						primaryThs.forEach((pTh, idx) => {
							const otherIndex = parseInt(
								pTh.getAttribute("data-sort-index"),
								10,
							);
							if (otherIndex > removedIndex) {
								syncHeaderAttributes(
									idx,
									pTh.getAttribute("data-sort"),
									otherIndex - 1,
								);
							}
						});
					}
				} else {
					const activeSortedThs =
						primaryThs[0].parentNode.querySelectorAll(
							"th[data-sort]",
						);
					const newIndex = activeSortedThs.length;
					syncHeaderAttributes(columnIndex, "asc", newIndex);
				}

				sortAndRepaginateGroup();
			});
		});
	});
};

export const attachPrintFn = (btn) => {
	if (btn) {
		btn.addEventListener("click", () => {
			document.title = `${import.meta.env.VITE_SOURCE_LC} report ${saveDate()}`;
			window.print();
			document.title = `${import.meta.env.VITE_SOURCE_LC} report`;
		});
	}
};

export const attachInfoFn = (btn, faq) => {
	if (!btn) return;

	const browser = getBrowserInfo();

	const ext = {
		edge: {
			url: "https://microsoftedge.microsoft.com/addons/detail/copy-as-csv/haojhahdnblgjpbeipemdkndbnkaiogj",
			name: "Copy to CSV",
			by: "Free Software Apps",
			icon: "copy_to_csv.png",
		},
		chrome: {
			url: "https://chromewebstore.google.com/detail/copy-as-csv/nmbngliaokchkodkidehnjbhgpkihdko",
			name: "Copy to CSV",
			by: "Free Useful Apps",
			icon: "copy_to_csv.png",
		},
		firefox: {
			url: "https://www.google.com/search?q=copy+html+table+as+csv+extension+for+firefox+browser",
			name: "search on Google",
			by: null,
			icon: null,
		},
		safari: {
			url: "https://www.google.com/search?q=copy+html+table+as+csv+extension+for+safari+browser",
			name: "search on Google",
			by: null,
			icon: null,
		},
		opera: {
			url: "https://www.google.com/search?q=copy+html+table+as+csv+extension+for+opera+browser",
			name: "search on Google",
			by: null,
			icon: null,
		},
		unknown: {
			url: "https://www.google.com/search?q=copy+html+table+as+csv+extension+for+my+browser",
			name: "search on Google",
			by: null,
			icon: null,
		},
	};

	btn.addEventListener("click", () => {
		// Fall back to 'unknown' if detected browser isn't in the object map
		const extData = ext[browser] || ext.unknown;

		const htmlMessage = (extData) => {
			if (extData.by) {
				return `Please install the <a href="${extData.url}" target="_blank" rel="noopener noreferrer" class="ext-link" title="Extension by ${extData.by}"><img src="${extData.icon}" alt="icon" /> ${extData.name}</a> extension to copy tables from ${import.meta.env.VITE_SOURCE_UC}.`;
			} else {
				return `Please <a href="${extData.url}" target="_blank" rel="noopener noreferrer" class="ext-link">${extData.name} for copy html table as csv extension</a> to copy tables from ${import.meta.env.VITE_SOURCE_UC}.`;
			}
		};

		const msg = String(faq).replaceAll("%ITEM_3%", htmlMessage(extData));

		showModal("Frequently Asked Questions", msg, null, "Okay", "primary");
	});
};

async function generatePDF(selector, filename = "document.pdf") {
	const pages = Array.from(document.querySelectorAll(selector));

	if (pages.length === 0) {
		console.warn("No pages found matching selector:", selector);
		return;
	}

	// 1. Process all pages in parallel using JPEG and lower fixed resolution
	const canvasPromises = pages.map(async (pageElement) => {
		const width = pageElement.offsetWidth;
		const height = pageElement.offsetHeight;

		const canvas = await toCanvas(pageElement, {
			pixelRatio: 1.5, // 1.5x gives high print clarity with 50% fewer pixels than ratio 2
			width: width,
			height: height,
		});

		// Convert canvas directly to JPEG string (much faster encoding than PNG)
		const imgData = canvas.toDataURL("image/jpeg");

		// Immediate cleanup
		canvas.width = 0;
		canvas.height = 0;

		return imgData;
	});

	const pageImages = await Promise.all(canvasPromises);

	const pdf = new jsPDF({
		orientation: "portrait",
		unit: "mm",
		format: "a4",
	});

	const pdfWidth = pdf.internal.pageSize.getWidth();
	const pdfHeight = pdf.internal.pageSize.getHeight();

	pageImages.forEach((imgData, index) => {
		if (index > 0) {
			pdf.addPage("a4", "portrait");
		}

		// JPEG format with FAST compression setting
		pdf.addImage(
			imgData,
			"JPEG",
			0,
			0,
			pdfWidth,
			pdfHeight,
			`page-${index}`,
			"FAST",
		);
	});

	pdf.save(filename);
}

export const attachDownloadPdfFn = (btn) => {
	if (btn) {
		btn.addEventListener("click", async () => {
			btn.setAttribute("disabled", "disabled");

			// 1. Find the SVG element and save its HTML string
			const svgIcon = btn.querySelector("svg");
			const originalSvg = svgIcon ? svgIcon.outerHTML : "";

			// 2. Replace the SVG with a spinner element
			if (svgIcon) {
				svgIcon.outerHTML = '<span class="btn-spinner"></span>';
			}

			// 3. Allow browser to paint the spinner UI before running heavy CPU task
			await new Promise((resolve) =>
				requestAnimationFrame(() => setTimeout(resolve, 50)),
			);

			try {
				await generatePDF(
					"#result div.page",
					`${import.meta.env.VITE_SOURCE_LC} report ${saveDate()}.pdf`,
				);
			} finally {
				// 4. Restore the original SVG icon and enable the button
				const spinner = btn.querySelector(".btn-spinner");
				if (spinner) {
					spinner.outerHTML = originalSvg;
				}
				btn.removeAttribute("disabled");
			}
		});
	}
};
