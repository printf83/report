import { getCorrection } from "./correction";
import {
	convertDictionaryToTranslator,
	splitCsvLine,
	translateDictionary,
} from "./util";

const sourceTitle = import.meta.env.VITE_SOURCE_UC;

export function locationCsvToArray(csv, company) {
	const lines = splitCsvLine(csv);

	return lines
		.map((line) => {
			const parts = line.split(",").map((item) => item.trim());

			if (parts && parts.length === 2) {
				return {
					name: parts[0],
					location: translateLocation(parts[1] || null),
					company: company || null,
				};
			} else {
				console.warn(
					`Skip "${line}". Line should be have 2 parts but receive only ${parts ? parts.length : 0} parts`,
				);
			}

			return null;
		})
		.filter(Boolean);
}

const locationDictionary = {
	"SMK AGAMA": "SMKA",
	"SR ISLAM": "SR(I)",
	KRAFTANGAN: "KRFTGN",
	DAN: "&",
	ASRAMA: "ASRM",
	SULTAN: "SLTN",
	PENDIDIKAN: "PDKN",
	BUKIT: "BKT",
};

const locationTranslator = convertDictionaryToTranslator(locationDictionary);

const translateLocation = (location) => {
	return translateDictionary(locationTranslator, location);
};

// Fungsi ini akan menghasilkan key company - name dan name
// Jadi setiap item akan mempunyai 2 key bagi mengelakkan data duplication diantara company
// Tetapi data duplication masih boleh berlaku sekiranya ada pekerja yang mempunyai name yg sama dalam 1 company
export function buildLocationMap(mapCorrection, mapLocation, data) {
	if (data && Array.isArray(data) && data.length > 0) {
		data.forEach((p) => {
			if (p.name && p.company) {
				const name = getCorrection(mapCorrection, p.name);

				const key = `${p.company} - ${name}`;
				if (!mapLocation.has(key)) {
					const q = {
						name,
						location: p.location,
						company: p.company,
					};

					mapLocation.set(key, q);

					// if (!mapLocation.has(name)) {
					// 	mapLocation.set(name, q);
					// }

					// ES2026 Update map.getOrInsert
					mapLocation.getOrInsert(name, q);
				} else {
					console.warn(
						`Pekerja dengan name "${key}" sudah wujud dalam map. Pekerja diabaikan.`,
					);
				}
			}
		});
	}
}

export function getLocation(map, name, company) {
	const key = `${company} - ${name}`;
	if (map.has(key)) {
		const p = map.get(key);

		if (p.company === company) {
			return p.location || "";
		} else {
			return (
				`<span class="dark ${p.company === sourceTitle ? "danger" : "warning"}">${p.company}</span> ${p.location}` ||
				""
			);
		}
	} else if (map.has(name)) {
		const p = map.get(name);
		if (p.company === company) {
			return p.location || "";
		} else {
			return (
				`<span class="dark ${p.company === sourceTitle ? "danger" : "warning"}">${p.company}</span> ${p.location}` ||
				""
			);
		}
	} else {
		return "";
	}
}
