import {
	convertDictionaryToTranslator,
	splitCsvLine,
	translateDictionary,
} from "./util";

export function vettingRequestCsvToArray(csv) {
	const lines = splitCsvLine(csv);

	return lines
		.map((line) => {
			const parts = line.split(",").map((item) => item.trim());

			if (parts && parts.length === 6) {
				return {
					no: parseInt(parts[0]),
					refNo: parts[1],
					name: parts[2],
					nric: parts[3],
					status: parts[4],
					activity: parts[5] || null, // Nilai null untuk ruangan kosong di hujung
				};
			} else {
				console.warn(
					`Skip "${line}". Line should be have 6 parts but receive only ${parts ? parts.length : 0} parts`,
				);
			}

			return null;
		})
		.filter(Boolean);
}

const vettingDictionary = {
	"PERMOHONAN BARU": "BARU",
	"TIDAK LENGKAP": "TAK LENGKAP",
};

const vettingTranslator = convertDictionaryToTranslator(vettingDictionary);

export function translateVetting(vetting) {
	return translateDictionary(vettingTranslator, vetting);
}
