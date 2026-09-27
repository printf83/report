import { splitCsvLine } from "./util";

export function csgAttendCsvToArray(csv) {
	const lines = splitCsvLine(csv);

	const result = lines
		.map((line) => {
			if (!line.trim()) return null;

			// Jangan guna .match(), terus split menggunakan regex lookahead untuk mengekalkan ruangan kosong (,,)
			const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

			if (parts && parts.length === 6) {
				// Bersihkan quotes luar dan trim space kosong
				const cleanParts = parts.map((item) =>
					item.trim().replace(/^"|"$/g, "").trim(),
				);

				// Memecahkan Maklumat Pengawal kepada: name dan No. KP (12 digit)
				const infoMaklumat = cleanParts[1] || "";
				const infoMatch = infoMaklumat.match(/^(.+?)\s+(\d{12})$/);

				return {
					no: parseInt(cleanParts[0]),
					name: infoMatch ? infoMatch[1].trim() : infoMaklumat,
					nric: infoMatch ? infoMatch[2] : null,
					location: cleanParts[2] || null, // Kini mengembalikan null dengan betul jika ,,
					dateStart: cleanParts[3] || null,
					dateEnd: cleanParts[4] || null,
					refNo: cleanParts[5] || null,
				};
			} else {
				console.warn(
					`Skip "${line}". Line should be have 6 parts but receive only ${parts ? parts.length : 0} parts`,
				);
			}

			return null;
		})
		.filter(Boolean); // Membuang baris kosong atau null daripada array akhir

	return result;
}

export function buildCsgAttendMap(map, data) {
	if (data && Array.isArray(data) && data.length > 0) {
		data.forEach((p) => {
			// if (p.nric && !map.has(p.nric)) {
			// 	map.set(p.nric, p);
			// }

			// ES2026 Update map.getOrInsert
			if (p.nric) {
				map.getOrInsert(p.nric, p);
			}
		});
	}
}

export function getCsgAttend(map, nric) {
	//semak dari TelahHadirCSG
	if (map.has(nric)) {
		const p = map.get(nric);
		if (p.refNo) {
			return `HADIR (No.${p.refNo})`;
		} else {
			return `HADIR`;
		}
	} else {
		return "BELUM HADIR";
	}
}
