import { splitCsvLine } from "./util";

export function vettingResultCsvToArray(csv) {
	const lines = splitCsvLine(csv);

	return lines
		.map((line) => {
			const parts = line.split(",").map((item) => item.trim());

			if (parts && parts.length === 7) {
				return {
					no: parseInt(parts[0]),
					refNo: parts[1],
					name: parts[2],
					nric: parts[3],
					type: parts[4],
					status: parts[5],
					activity: parts[6] || null, // Nilai null jika kosong (hujung koma)
				};
			} else {
				console.warn(
					`Skip "${line}". Line should be have 7 parts but receive only ${parts ? parts.length : 0} parts`,
				);
			}

			return null;
		})
		.filter(Boolean);
}
