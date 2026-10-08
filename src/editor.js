import JSZip from "jszip";
import { saveAs } from "file-saver";
import { buildResult } from "./page";
import { db } from "./db";
import { showModal } from "./modal";

export const attachDlg = (
	btn,
	dlg,
	tabTemplate,
	panelTemplate,
	result,
	data,
	resetData,
) => {
	if (dlg) {
		//attach dlg open btn
		if (btn) {
			btn.addEventListener("click", () => {
				document.body.classList.add("dialog-open");
				dlg.showModal();
				resizeTabContent(dlg);
			});

			// Attach Ctrl+E shortcut to trigger the button click
			document.addEventListener("keydown", (e) => {
				// e.code handles layout differences; e.key handles standard keyboard inputs
				if (
					(e.ctrlKey || e.metaKey) &&
					(e.key === "e" || e.key === "E")
				) {
					e.preventDefault(); // Prevents default browser shortcuts (e.g. focusing search bar in Chrome)
					btn.click();
				}
			});
		}

		//attach save btn
		const btnSave = dlg.querySelector(".btn-dlg-save");
		if (btnSave) {
			btnSave.addEventListener("click", () => {
				const d = getDlgData(dlg);
				db.set("data", d);
				buildResult(result, d);
				dlg.close();
			});
		}

		//attach reset btn
		const btnReset = dlg.querySelector(".btn-dlg-reset");
		if (btnReset) {
			btnReset.addEventListener("click", () => {
				showModal(
					"Reset all data?",
					"All data will be <b>reset to a default sample template</b>. This action cannot be undone. Please ensure you have backed up your data before proceeding.",
					"I have a backup",
					"Yes, reset",
					"danger",
					() => {
						setDlgData(dlg, tabTemplate, panelTemplate, resetData);
					},
				);
			});
		}

		//attach hide btn
		const btnHide = dlg.querySelector(".btn-dlg-hide");
		if (btnHide) {
			btnHide.addEventListener("click", () => {
				dlg.close();
			});
		}

		// Close dialog when clicking the backdrop
		dlg.addEventListener("click", (e) => {
			const rect = dlg.getBoundingClientRect();

			// Check if the click coordinates fall outside the dialog bounds
			const isClickOutside =
				e.clientX < rect.left ||
				e.clientX > rect.right ||
				e.clientY < rect.top ||
				e.clientY > rect.bottom;

			if (isClickOutside) {
				dlg.close();
			}
		});

		dlg.addEventListener("close", () => {
			document.body.classList.remove("dialog-open");
		});

		//attach search
		attachSearch(dlg);

		//attach tab
		attachTab(dlg, tabTemplate, panelTemplate);

		//attach download
		attachDownloadZip(dlg);

		//attach upload
		attachUploadZip(dlg, tabTemplate, panelTemplate);
		attachUploadDir(dlg, tabTemplate, panelTemplate);

		//set data
		setDlgData(dlg, tabTemplate, panelTemplate, data);
	}
};

const setDlgData = (dlg, tabTemplate, panelTemplate, data) => {
	const searchInput = dlg.querySelector(".dlg-search-input");
	const matchCounter = dlg.querySelector(".dlg-search-counter");
	const tabList = dlg.querySelector(".dlg-tab-list");
	const tabContent = dlg.querySelector(".dlg-tab-content");
	const firstTab = dlg.querySelector(".dlg-tab-main");

	// cleanup
	resetSearch(searchInput, matchCounter, tabContent);
	tabList.querySelectorAll(".tab-data").forEach((i) => i.remove());
	tabContent.querySelectorAll(".tab-panel-data").forEach((i) => i.remove());

	// add tab with data
	if (data.item && data.item.length > 0) {
		data.item.forEach((d) => {
			addDlgTab(tabTemplate, panelTemplate, tabList, tabContent, d);
		});
	}

	resizeTabContent(dlg);

	const nameCorrection = document.getElementById("name-correction");
	const locationSource = document.getElementById("location-source");

	nameCorrection.value = data.correction;
	locationSource.value = data.location;

	activateTab(firstTab, tabList, tabContent);
};

const getDlgData = (dlg) => {
	const tabContent = dlg.querySelector(".tab-content");

	const nameCorrection = dlg.querySelector(".dlg-tab-main-name-correction");
	const locationSource = dlg.querySelector(".dlg-tab-main-location-source");

	const tabPanelData = tabContent.querySelectorAll(".tab-panel-data");

	const item = Array.from(tabPanelData).map((i) => {
		return {
			company: i.querySelector(".input-company")?.value || "",
			csgAttend: i.querySelector(".input-csg-attend")?.value || "",
			vettingResult:
				i.querySelector(".input-vetting-result")?.value || "",
			vettingRequest:
				i.querySelector(".input-vetting-request")?.value || "",
			location: i.querySelector(".input-location")?.value || "",
		};
	});

	const result = {
		correction: nameCorrection?.value || "",
		location: locationSource?.value || "",
		item: item,
	};

	return result;
};

/* TAB */
let tabCount = 0;

const attachTab = (dlg, tabTemplate, panelTemplate) => {
	const searchInput = dlg.querySelector(".dlg-search-input");
	const matchCounter = dlg.querySelector(".dlg-search-counter");
	const tabList = dlg.querySelector(".dlg-tab-list");
	const tabContent = dlg.querySelector(".dlg-tab-content");
	const addTabBtn = dlg.querySelector(".dlg-tab-add");

	// Event Delegation for Switching & Closing Tabs
	tabList.addEventListener("click", (e) => {
		const closeBtn = e.target.closest(".tab-close");
		const tabBtn = e.target.closest(".tab");
		const company = tabBtn.textContent.toString().trim();

		// Handle Close Button Click
		if (closeBtn) {
			e.stopPropagation(); // Stop switching tab when clicking close

			showModal(
				"Remove this company?",
				`Company <b>${company} will be removed</b>. This action cannot be undone. Please ensure you have backed up your data before proceeding.`,
				"I have a backup",
				"Yes, remove",
				"danger",
				() => {
					const targetTab = closeBtn.closest(".tab");
					const targetPanelId =
						targetTab.getAttribute("aria-controls");
					const wasActive = targetTab.classList.contains("active");

					// Find nearest neighbor to activate if removed tab was active
					const nextTabToActivate =
						targetTab.previousElementSibling ||
						targetTab.nextElementSibling;

					// Remove tab button and panel
					targetTab.remove();
					document.getElementById(targetPanelId)?.remove();

					resizeTabContent(dlg);

					resetSearch(searchInput, matchCounter, tabContent);

					// If removed tab was active, switch to adjacent tab
					if (
						wasActive &&
						nextTabToActivate &&
						!nextTabToActivate.classList.contains("dlg-tab-add")
					) {
						activateTab(nextTabToActivate, tabList, tabContent);
					}
				},
			);

			return;
		}

		// Handle Regular Tab Click (Exclude the '+' button)
		if (tabBtn && !tabBtn.classList.contains("dlg-tab-add")) {
			activateTab(tabBtn, tabList, tabContent);
		}
	});

	// Handle "+" Button (Add new tab before "+")
	addTabBtn.addEventListener("click", () => {
		addDlgTab(tabTemplate, panelTemplate, tabList, tabContent);
		resizeTabContent(dlg);
	});
};

const resizeTabContent = (dlg) => {
	const tabContent = dlg.querySelector(".tab-content");
	const tabList = dlg.querySelector(".tab-list");
	const dlgAction = dlg.querySelector(".dialog-actions");

	if (tabContent && tabList && dlgAction) {
		const listHeight = parseInt(tabList.offsetHeight, 10); //45
		const actionHeight = parseInt(dlgAction.offsetHeight, 10); //42
		//best height 230 ()
		tabContent.style.maxHeight = `calc(100dvh - ${listHeight + actionHeight + 183}px)`;
	}
};

const activateTab = (tabBtn, tabList, tabContent) => {
	const targetId = tabBtn.getAttribute("aria-controls");
	if (!targetId) return;

	// Deactivate all
	tabList.querySelectorAll(".tab:not(.dlg-tab-add)").forEach((t) => {
		t.classList.remove("active");
		t.setAttribute("aria-selected", "false");
	});
	tabContent
		.querySelectorAll(".tab-panel")
		.forEach((p) => p.classList.remove("active"));

	// Activate clicked tab and panel
	tabBtn.classList.add("active");
	tabBtn.setAttribute("aria-selected", "true");
	document.getElementById(targetId)?.classList.add("active");
};

const setLabel = (container, name, key, value) => {
	const lbl = container.querySelector(`.label-${name}`);
	const input = container.querySelector(`.input-${name}`);
	const id = `${name}-${key}`;

	lbl.setAttribute("for", id);
	input.id = id;

	if (value) {
		input.value = value;
	}
};

const addDlgTab = (tabTemplate, panelTemplate, tabList, tabContent, data) => {
	tabCount++;
	const key = crypto.randomUUID();
	const tabId = `tab-${key}`;
	const panelId = `panel-${key}`;

	// 1. Clone & Populate Tab
	const tabClone = tabTemplate.content.cloneNode(true);
	const newTab = tabClone.querySelector(".tab");

	newTab.id = tabId;
	newTab.setAttribute("aria-controls", panelId);

	const tabLabel = newTab.querySelector(".tab-label");
	tabLabel.textContent = data?.company || `Company ${tabCount}`;

	// Insert before the "+" button
	const addTabBtn = tabList.querySelector(".dlg-tab-add");
	tabList.insertBefore(newTab, addTabBtn);

	// Clone Panel
	const panelClone = panelTemplate.content.cloneNode(true);
	const newPanel = panelClone.querySelector(".tab-panel");

	newPanel.id = panelId;
	newPanel.setAttribute("aria-labelledby", tabId);

	// Dynamic IDs & labels for input
	setLabel(newPanel, "company", key, data?.company || `Company ${tabCount}`);
	setLabel(newPanel, "vetting-request", key, data?.vettingRequest || null);
	setLabel(newPanel, "vetting-result", key, data?.vettingResult || null);
	setLabel(newPanel, "csg-attend", key, data?.csgAttend || null);
	setLabel(newPanel, "location", key, data?.location || null);

	// Append to DOM
	tabContent.appendChild(newPanel);

	// Activate tab
	const insertedTab = document.getElementById(tabId);
	activateTab(insertedTab, tabList, tabContent);

	// Live update tab label on company input change
	const txtCompany = document.getElementById(`company-${key}`);
	txtCompany.addEventListener("input", (e) => {
		const newTitle = e.target.value.trim();
		// Fallback to "Unnamed" if empty
		tabLabel.textContent = newTitle || "Unnamed";
	});
};

/* SEARCH */
let dlgSearchMatches = [];
let dlgSearchCurrentMatchIndex = -1;

const attachSearch = (dlg) => {
	const searchInput = dlg.querySelector(".dlg-search-input");
	const prevBtn = dlg.querySelector(".dlg-search-prev");
	const nextBtn = dlg.querySelector(".dlg-search-next");
	const matchCounter = dlg.querySelector(".dlg-search-counter");
	const tabList = dlg.querySelector(".dlg-tab-list");
	const tabContent = dlg.querySelector(".dlg-tab-content");

	// Real-time counter updates as you type without changing focus
	searchInput.addEventListener("input", () => {
		performSearch(searchInput, matchCounter, tabContent);
	});

	// Navigation buttons trigger focus shift
	nextBtn.addEventListener("click", () => {
		if (dlgSearchMatches.length === 0) return;
		dlgSearchCurrentMatchIndex =
			(dlgSearchCurrentMatchIndex + 1) % dlgSearchMatches.length;
		highlightCurrentMatch(tabList, tabContent, searchInput, matchCounter);
	});

	prevBtn.addEventListener("click", () => {
		if (dlgSearchMatches.length === 0) return;
		dlgSearchCurrentMatchIndex =
			(dlgSearchCurrentMatchIndex - 1 + dlgSearchMatches.length) %
			dlgSearchMatches.length;
		highlightCurrentMatch(tabList, tabContent, searchInput, matchCounter);
	});

	// Enter moves focus to match, Shift+Enter moves to previous match
	searchInput.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (dlgSearchMatches.length === 0) return;

			if (e.shiftKey) {
				dlgSearchCurrentMatchIndex =
					(dlgSearchCurrentMatchIndex - 1 + dlgSearchMatches.length) %
					dlgSearchMatches.length;
			} else {
				// If focus is still on input, jump to current match; otherwise advance index
				if (document.activeElement !== searchInput) {
					dlgSearchCurrentMatchIndex =
						(dlgSearchCurrentMatchIndex + 1) %
						dlgSearchMatches.length;
				}
			}
			highlightCurrentMatch(
				tabList,
				tabContent,
				searchInput,
				matchCounter,
			);
		}
	});
};

const resetSearch = (searchInput, matchCounter, tabContent) => {
	searchInput.value = "";
	performSearch(searchInput, matchCounter, tabContent);
};

// const escapeRegExp = (string) => {
// 	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// };

// Scan across ALL tab panels for matches (does NOT focus textareas)
const performSearch = (searchInput, matchCounter, tabContent) => {
	const query = searchInput.value;
	dlgSearchMatches = [];
	dlgSearchCurrentMatchIndex = -1;

	if (!query.trim()) {
		updateSearchUI(searchInput, matchCounter);
		return;
	}

	const allPanels = tabContent.querySelectorAll(".tab-panel");
	const regex = new RegExp(RegExp.escape(query), "gi"); //ES2026 RegExp.escape

	allPanels.forEach((panel) => {
		const fields = panel.querySelectorAll("textarea, input[type='text']");

		fields.forEach((field) => {
			const text = field.value;
			let match;

			while ((match = regex.exec(text)) !== null) {
				dlgSearchMatches.push({
					field: field,
					panel: panel,
					start: match.index,
					end: match.index + match[0].length,
				});
			}
		});
	});

	if (dlgSearchMatches.length > 0) {
		dlgSearchCurrentMatchIndex = 0;
	}

	updateSearchUI(searchInput, matchCounter);
};

// Explicitly highlight & focus only when triggered by user navigation
const highlightCurrentMatch = (
	tabList,
	tabContent,
	searchInput,
	matchCounter,
) => {
	if (
		dlgSearchCurrentMatchIndex < 0 ||
		dlgSearchCurrentMatchIndex >= dlgSearchMatches.length
	)
		return;

	const match = dlgSearchMatches[dlgSearchCurrentMatchIndex];
	const targetField = match.field;
	const parentPanel = match.panel;

	// Switch to parent tab if inactive
	if (!parentPanel.classList.contains("active")) {
		const tabId = parentPanel.getAttribute("aria-labelledby");
		const targetTab = document.getElementById(tabId);

		if (targetTab) {
			activateTab(targetTab, tabList, tabContent);
		}
	}

	setTimeout(() => {
		targetField.focus();
		targetField.setSelectionRange(match.start, match.end);

		if (targetField.tagName === "TEXTAREA") {
			// Compute exact line height dynamically
			const computed = window.getComputedStyle(targetField);
			const fontSize = parseFloat(computed.fontSize) || 14;
			let lineHeight = parseFloat(computed.lineHeight);

			if (isNaN(lineHeight)) {
				lineHeight = fontSize * 1.2; // Fallback for 'normal' line-height
			}

			const textBefore = targetField.value.substring(0, match.start);
			const lineNumber = textBefore.split("\n").length;

			targetField.scrollTop = (lineNumber - 2) * lineHeight;
		}

		targetField.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
		});
	}, 50);

	updateSearchUI(searchInput, matchCounter);
};

const updateSearchUI = (searchInput, matchCounter) => {
	if (dlgSearchMatches.length === 0) {
		matchCounter.textContent = searchInput?.value.trim()
			? "0 found"
			: "0 of 0";
	} else {
		matchCounter.textContent = `${dlgSearchCurrentMatchIndex + 1} of ${dlgSearchMatches.length}`;
	}
};

/* DOWNLOAD */
const attachDownloadZip = (dlg) => {
	const btn = dlg.querySelector(".btn-dlg-download");
	if (btn) {
		btn.addEventListener("click", async () => {
			const data = getDlgData(dlg);
			const zip = new JSZip();

			zip.file("location.csv", data.location);
			zip.file("correction.csv", data.correction);

			if (data.item && data.item.length > 0) {
				data.item.forEach((d) => {
					if (d.company) {
						const company = d.company.toString().toLowerCase();

						zip.file(`${company}/csgAttend.csv`, d.csgAttend);

						zip.file(`${company}/location.csv`, d.location);

						zip.file(
							`${company}/vettingRequest.csv`,
							d.vettingRequest,
						);

						zip.file(
							`${company}/vettingResult.csv`,
							d.vettingResult,
						);
					}
				});
			}

			// 4. Generate the ZIP file blob
			const zipBlob = await zip.generateAsync({ type: "blob" });

			// 5. Trigger browser download
			saveAs(
				zipBlob,
				`csv report ${new Date().toISOString().split("T")[0].toString().replaceAll("-", "")}.zip`,
			);
		});
	}
};

/* UPLOAD */
// Shared helper to process a relative path & file content into the structure
const processCsvPath = (relativePath, fileContent, uploadedData) => {
	if (relativePath === "location.csv") {
		uploadedData.location = fileContent;
	} else if (relativePath === "correction.csv") {
		uploadedData.correction = fileContent;
	} else if (relativePath.includes("/")) {
		const parts = relativePath.split("/"); // ['companyName', 'fileName.csv']
		const company = parts[0];
		const fileName = parts[1];

		if (!uploadedData.itemsMap[company]) {
			uploadedData.itemsMap[company] = {
				company: company.toString().toUpperCase(),
			};
		}

		if (fileName === "csgAttend.csv") {
			uploadedData.itemsMap[company].csgAttend = fileContent;
		} else if (fileName === "location.csv") {
			uploadedData.itemsMap[company].location = fileContent;
		} else if (fileName === "vettingRequest.csv") {
			uploadedData.itemsMap[company].vettingRequest = fileContent;
		} else if (fileName === "vettingResult.csv") {
			uploadedData.itemsMap[company].vettingResult = fileContent;
		}
	}
};

export const attachUploadZip = (dlg, tabTemplate, panelTemplate) => {
	const btn = dlg.querySelector(".btn-dlg-upload-zip");
	if (!btn) return;

	btn.addEventListener("click", () => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".zip";

		input.addEventListener("change", async (event) => {
			const file = event.target.files[0];
			if (!file) return;

			try {
				const zip = new JSZip();
				const contents = await zip.loadAsync(file);

				const uploadedData = {
					location: "",
					correction: "",
					itemsMap: {},
				};

				for (const [relativePath, zipEntry] of Object.entries(
					contents.files,
				)) {
					if (zipEntry.dir) continue;
					const fileContent = await zipEntry.async("string");

					// Use shared processor
					processCsvPath(relativePath, fileContent, uploadedData);
				}

				const finalData = {
					location: uploadedData.location,
					correction: uploadedData.correction,
					item: Object.values(uploadedData.itemsMap),
				};

				setDlgData(dlg, tabTemplate, panelTemplate, finalData);
			} catch (error) {
				console.error("Error reading ZIP file:", error);
			} finally {
				event.target.value = "";
			}
		});

		input.click();
	});
};

export const attachUploadDir = (dlg, tabTemplate, panelTemplate) => {
	const btn = dlg.querySelector(".btn-dlg-upload-dir");
	if (!btn) return;

	btn.addEventListener("click", () => {
		const input = document.createElement("input");
		input.type = "file";
		input.webkitdirectory = true;

		input.addEventListener("change", async (event) => {
			const files = Array.from(event.target.files);
			if (!files.length) return;

			const uploadedData = {
				location: "",
				correction: "",
				itemsMap: {},
			};

			try {
				for (const file of files) {
					if (!file.name.endsWith(".csv")) continue;

					// Strip the root folder name from webkitRelativePath
					const pathSegments = file.webkitRelativePath.split("/");
					pathSegments.shift();
					const relativePath = pathSegments.join("/");

					const fileContent = await file.text();

					// Use shared processor
					processCsvPath(relativePath, fileContent, uploadedData);
				}

				const finalData = {
					location: uploadedData.location,
					correction: uploadedData.correction,
					item: Object.values(uploadedData.itemsMap),
				};

				setDlgData(dlg, tabTemplate, panelTemplate, finalData);
			} catch (error) {
				console.error("Error reading directory:", error);
			} finally {
				event.target.value = "";
			}
		});

		input.click();
	});
};
