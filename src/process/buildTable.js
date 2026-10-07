import { MAX_ROWS_PER_PAGE, TABLE_TITLE_ROWS } from "../const";
import {
	spanLabel,
	spanValue,
	attrValue,
	tdVetting,
	tdCsg,
	tdLocation,
	tdNric,
} from "./util";

const sourceText = `<span class="dark danger">${import.meta.env.VITE_SOURCE_UC}</span>`;

export function buildTable(company, data, dataAll, title = "all") {
	// 1. Bina colgroup
	const tableColgroup = `
		<col style="width:30px"/>
		<col/>
		<col style="width:85px"/>
		<col style="width:150px"/>
		<col style="width:90px"/>
		<col style="width:105px"/>
	`;

	// 2. Bina bahagian Header
	const tableHeader = `
		<tr>
			<th>Bil</th>
			<th data-sort="asc" data-sort-index="2">Nama</th>
			<th>No. KP</th>
			<th data-sort="asc" data-sort-index="0">Lokasi</th>
			<th>Tapisan</th>
			<th data-sort="desc" data-sort-index="1">CSG</th>
		</tr>
	`;

	let report = {
		totalWorker: 0,
		vettingPass: 0,
		vettingFail: 0,
		vettingRequest: 0,
		csgAttend: 0,
		csgMiss: 0,
		csgZero: 0,
		vettingPassAndCsgAttend: 0,
		vettingPassAndCsgMiss: 0,
		vettingRequestAndCsgAttend: 0,
		overAge: 0,
		notInLocation: 0,
	};

	const updateReport = (d) => {
		const itemClassName = [];
		report.totalWorker += 1;

		if (d.vetting === "LULUS") {
			report.vettingPass += 1;
			itemClassName.push("vettingPass");
		} else if (d.vetting === "GAGAL") {
			report.vettingFail += 1;
			itemClassName.push("vettingFail");
		} else if (d.vetting === "LEBIH HAD UMUR") {
			report.overAge += 1;
			itemClassName.push("overAge");
		} else {
			report.vettingRequest += 1;
			itemClassName.push("vettingRequest");
		}

		if (d.csg.startsWith("HADIR")) {
			report.csgAttend += 1;
			itemClassName.push("csgAttend");

			const match = d.csg.match(/\d+/);
			const refNo = match ? match[0] : null;

			// Menilai sama ada noSiri wujud DAN nilainya bukan sekadar kosong/zero (0, 00, dll)
			if (!(refNo && Number(refNo) !== 0)) {
				report.csgZero += 1;
				itemClassName.push("csgZero");
			}
		} else if (d.csg === "BELUM HADIR") {
			report.csgMiss += 1;
			itemClassName.push("csgMiss");
		}

		if (d.vetting === "LULUS") {
			if (d.csg.startsWith("HADIR")) {
				report.vettingPassAndCsgAttend += 1;
				itemClassName.push("vettingPassAndCsgAttend");
			} else if (d.csg === "BELUM HADIR") {
				report.vettingPassAndCsgMiss += 1;
				itemClassName.push("vettingPassAndCsgMiss");
			}
		}

		if (d.vetting !== "LULUS" && d.vetting !== "GAGAL") {
			if (d.csg.startsWith("HADIR")) {
				report.vettingRequestAndCsgAttend += 1;
				itemClassName.push("vettingRequestAndCsgAttend");
			}
		}

		if (d.location.startsWith(sourceText)) {
			report.notInLocation += 1;
			itemClassName.push("notInLocation");
		}

		return itemClassName;
	};

	// 3. Bina baris-baris data (Rows) menggunakan .map()
	const tableRows = data.map((d, index) => {
		const itemClassName = updateReport(d);

		return `
				<tr${attrValue("class", itemClassName)}>
					<td>${index + 1}</td>
					<td>${d.name}</td>
					<td>${tdNric(d.nric)}</td>
					<td>${tdLocation(d.location)}</td>
					<td${attrValue("class", tdVetting(d.vetting))}>${d.vetting}</td$>
					<td${attrValue("class", tdCsg(d.csg))}>${d.csg}</td$>
				</tr$>
    			`;
	});
	// 4. Bina caption
	let tableCaption = "";

	if (title === "all") {
		tableCaption = `
            <h1>Senarai Tapisan &amp; CSG PK ${company} di dalam sistem ${import.meta.env.VITE_SOURCE_UC} pada ${new Date().toLocaleDateString("en-GB")}</h1>
            <div>
                ${spanLabel("Jumlah PK")} 	:	${spanValue(report.totalWorker, "Orang PK", "primary")}<br/>
                ${spanLabel(`Tapisan <b>(${parseInt((report.vettingPass / report.totalWorker) * 100, 10)}%)</b>`)} 	:   
												${spanValue(report.vettingPass, "PK Lulus", "success", "vettingPass")}
                            					${spanValue(report.vettingRequest, "PK Dalam Proses", "warning", "vettingRequest")}
                            					${spanValue(report.vettingFail, "PK Gagal", "danger", "vettingFail")}
												${spanValue(report.overAge, "PK Lebih Had Umur", "danger", "overAge")}
                            					<br/>
                ${spanLabel(`CSG <b>(${parseInt((report.csgAttend / report.totalWorker) * 100, 10)}%)</b>`)} 		:	
												${spanValue(report.csgAttend, "PK Telah Hadir", "success", "csgAttend")} 
                            					${spanValue(report.csgMiss, "PK Belum Hadir", "warning", "csgMiss")}
												${spanValue(report.csgZero, "PK Tiada No Siri", "danger", "csgZero")}
                            					<br/>
                ${spanLabel("Nota")} 		:	${spanValue(report.vettingPassAndCsgAttend, "PK Selesai", "success", "vettingPassAndCsgAttend")}
                            					${spanValue(report.vettingRequestAndCsgAttend, "PK Hampir Selesai", "info", "vettingRequestAndCsgAttend")}
                            					${spanValue(report.vettingPassAndCsgMiss, "PK Boleh Kursus", "warning", "vettingPassAndCsgMiss")}
												${spanValue(report.notInLocation, "PK Tiada Dalam Senarai Gaji", "danger", "notInLocation")}


            </div>`;
	} else {
		tableCaption = `
            <h1>Senarai ${title} PK ${company} di dalam sistem ${import.meta.env.VITE_SOURCE_UC} pada ${new Date().toLocaleDateString("en-GB")}</h1>
            <div>
                ${spanLabel("Jumlah PK")} 	:	${spanValue(`${report.totalWorker} daripada ${dataAll.length}`, "Orang PK", "primary")}<br/>
				${spanLabel("Peratus")} 	:	${spanValue(Math.floor((report.totalWorker / dataAll.length) * 100), `% ${title}`, "primary")}<br/>
            </div>`;
	}

	// 5. Masukkan ke dalam result.innerHTML

	// Configuration for page capacities
	const tableTitleRows = TABLE_TITLE_ROWS(); // Space consumed on page 1
	const maxRowsPerPage = MAX_ROWS_PER_PAGE(); // Standard max rows for regular pages
	const firstPageMaxRows = maxRowsPerPage - tableTitleRows; // Capacity for page 1

	const pages = [];
	let currentIndex = 0;

	while (currentIndex < tableRows.length) {
		// Page 0 uses the reduced capacity; all subsequent pages use full capacity
		const currentPageSize =
			pages.length === 0 ? firstPageMaxRows : maxRowsPerPage;

		// Extract the slice for the current page
		const pageRows = tableRows.slice(
			currentIndex,
			currentIndex + currentPageSize,
		);
		pages.push(pageRows);

		// Advance the pointer by the number of rows processed
		currentIndex += currentPageSize;
	}

	const pageContents = pages.map((pageRows, pageIndex) => {
		return `
			<div class="page">
				<table class="output">
					${pageIndex === 0 ? `<caption>${tableCaption}</caption>` : ""}
					<colgroup>${tableColgroup}</colgroup>
					<thead>${tableHeader}</thead>
					<tbody>${pageRows.join("")}</tbody>
				</table>
			</div>
		`;
	});

	return `
		<div class="group">
			${pageContents.join("")}
		</div>
	`;
}
