import { splitCsvLine } from "./util";

export function correctionCsvToArray(csv) {
	const lines = splitCsvLine(csv);

	return lines
		.map((line) => {
			const parts = line.split(",").map((item) => item.trim());

			if (parts && parts.length === 2) {
				return {
					wrong: parts[0],
					correct: parts[1] || null,
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

export function buildCorrectionMap(map, data) {
	if (data && Array.isArray(data) && data.length > 0) {
		data.forEach((p) => {
			if (p.wrong && p.correct) {
				// if (!map.has(p.wrong)) {
				// 	map.set(p.wrong, p);
				// }

				// ES2026 Update map.getOrInsert
				map.getOrInsert(p.wrong, p);
			}
		});
	}
}

export function getCorrection(map, name) {
	if (map.has(name)) {
		const p = map.get(name);
		return p.correct;
	} else {
		return name;
	}
}
