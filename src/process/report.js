import { getLocation } from "./location";
import { translateVetting } from "./vettingRequest";
import { buildCsgAttendMap, getCsgAttend } from "./csgAttend";

const addIntoPekerjaMap = (
	mapWorker,
	mapCsg,
	mapLocation,
	company,
	name,
	nric,
	vetting,
) => {
	// if (name && nric && !mapWorker.has(nric)) {
	// 	const tname = name.toString().trim().toUpperCase();
	// 	mapWorker.set(nric, {
	// 		name: tname,
	// 		nric,
	// 		vetting: translateVetting(vetting),
	// 		csg: getCsgAttend(mapCsg, nric),
	// 		location: getLocation(mapLocation, tname, company),
	// 	});
	// }

	// ES2026 Update map.getOrInsert
	if (name && nric) {
		const tname = name.toString().trim().toUpperCase();
		mapWorker.getOrInsert(nric, {
			name: tname,
			nric,
			vetting: translateVetting(vetting),
			csg: getCsgAttend(mapCsg, nric),
			location: getLocation(mapLocation, tname, company),
		});
	}
};

export function processResult(data) {
	// Gunakan Map untuk mengelakkan duplikasi pekerja menggunakan nric sebagai key
	const mapWorker = new Map();
	const mapCsg = new Map();

	buildCsgAttendMap(mapCsg, data.csgAttend);

	const fnAdd = (name, nric, status) => {
		addIntoPekerjaMap(
			mapWorker,
			mapCsg,
			data.mapLocation,
			data.company,
			name,
			nric,
			status,
		);
	};

	const nameRules = [
		{ suffix: "LEBIH HAD UMUR", status: "LEBIH HAD UMUR" },
		{ suffix: "AKAN MENCAPAI HAD UMUR", status: null }, // Retains original status
		{
			suffix: "TIADA DOKUMEN LAPORAN PERUBATAN",
			status: "TAK LENGKAP",
		},
	];

	const addWorker = (nric, name, status) => {
		const matchedRule = nameRules.find((rule) =>
			name.endsWith(rule.suffix),
		);

		if (matchedRule) {
			const cleanedName = name
				.slice(0, -matchedRule.suffix.length)
				.trim();
			fnAdd(cleanedName, nric, matchedRule.status || status);
		} else {
			fnAdd(name.trim(), nric, status);
		}
	};

	// 1. masukkan pekerja dalam keputusan permohonan vetting kepada mapPekerja
	data.vettingResult.forEach((p) => {
		if (p.nric) {
			addWorker(p.nric, p.name.toUpperCase(), p.status);
		}
	});

	// 2. masukkan pekerja dalam senarai memohon ke dalam mapPekerja
	data.vettingRequest.forEach((p) => {
		if (p.nric) {
			addWorker(p.nric, p.name.toUpperCase(), p.status);
		}
	});

	// Tukar format Map kembali kepada Array biasa dan susun mengikut name (A-Z)
	return Array.from(mapWorker.values()).sort((a, b) => {
		return (
			a.location.localeCompare(b.location) ||
			b.csg.localeCompare(a.csg) ||
			a.name.localeCompare(b.name)
		);
	});
}
