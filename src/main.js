import { data } from "./data.js";
import { attachDlg } from "./editor.js";
import {
	buildResult,
	attachPrintFn,
	attachDownloadPdfFn,
	attachInfoFn,
} from "./page.js";
import { db } from "./db.js";

document.addEventListener("DOMContentLoaded", async () => {
	const container = document.querySelector("#result");
	const dlgEditor = document.querySelector("#dlgEditor");
	const btnPrint = document.querySelector("#btnPrint");
	const btnPDF = document.querySelector("#btnPDF");
	const btnEditor = document.querySelector("#btnEditor");
	const btnInfo = document.querySelector("#btnInfo");

	const tabTemplate = document.getElementById("tab-template");
	const panelTemplate = document.getElementById("panel-template");
	const faqTemplate = document.getElementById("faq-template");

	const savedData = await db.get("data");
	const d = savedData || data;

	buildResult(container, d);
	attachPrintFn(btnPrint);
	attachDownloadPdfFn(btnPDF);
	attachInfoFn(btnInfo, faqTemplate.innerHTML);
	attachDlg(
		btnEditor,
		dlgEditor,
		tabTemplate,
		panelTemplate,
		container,
		d,
		data,
	);
});
