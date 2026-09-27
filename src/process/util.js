export function splitCsvLine(csv) {
	if (!csv || typeof csv !== "string") return [];

	return csv
		.split(/\r?\n/) // Handles both Windows (\r\n) and Unix (\n) line endings
		.map((line) => line.trim()) // Strips whitespace surrounding each line
		.filter((line) => {
			if (!line) return false;

			// Normalize line to check for unwanted headers (handles quotes too)
			const cleanLine = line.replace(/['"]/g, "");

			return (
				!cleanLine.startsWith("Bil,") &&
				!cleanLine.startsWith("Name,") &&
				!cleanLine.startsWith("Wrong name in salary,")
			);
		});
}

export function tdVetting(vetting) {
	if (vetting === "LULUS") {
		return ["success"];
	} else if (vetting === "GAGAL" || vetting === "LEBIH HAD UMUR") {
		return ["danger", "text-danger"];
	} else {
		return [];
	}
}

export function tdCsg(csg) {
	if (csg.startsWith("HADIR")) {
		const match = csg.match(/\d+/);
		const noSiri = match ? match[0] : null;

		// Menilai sama ada noSiri wujud DAN nilainya bukan sekadar kosong/zero (0, 00, dll)
		if (noSiri && Number(noSiri) !== 0) {
			return ["success"];
		} else {
			return ["success", "text-danger"]; // Akan trigger jika null, "0", "00", "000000"
		}
	} else {
		return [];
	}
}

const sourceTitle = import.meta.env.VITE_SOURCE_UC;

export function tdLocation(lokasi) {
	if (lokasi.startsWith(sourceTitle)) {
		return `<span class="dark danger">${lokasi.slice(0, 6)}</span>${lokasi.slice(6)}`;
	} else {
		return lokasi;
	}
}

const currentYear = new Date().getFullYear();
const lastTenYears = currentYear - 15 - 2000;
const maxAge = 64;

export function tdNric(nric) {
	const firstTwoDigitYear = nric.slice(0, 2);
	let year = 0;
	if (Number(firstTwoDigitYear) <= lastTenYears) {
		year = Number(`20${firstTwoDigitYear}`);
	} else {
		year = Number(`19${firstTwoDigitYear}`);
	}

	if (currentYear - year >= maxAge) {
		return `<mark>${nric.slice(0, 6)}</mark>${nric.slice(6)}`;
	} else {
		return nric;
	}
}

export function attrValue(prop, value) {
	if (value) {
		if (Array.isArray(value) && value.length > 0) {
			return ` ${prop}="${value.join(" ")}"`;
		} else {
			return ` ${prop}="${value}"`;
		}
	} else {
		return "";
	}
}

export function spanValue(value, label, color, type) {
	if (value !== 0) {
		if (type) {
			return `<span${attrValue("class", color)}${attrValue("data-type", type)}>${value} ${label}</span>`;
		} else {
			return `<span${attrValue("class", color)}>${value} ${label}</span>`;
		}
	} else {
		return "";
	}
}

export function spanLabel(label) {
	return `<span class="label">${label}</span>`;
}

export const convertDictionaryToTranslator = (dictionaryObjectKeys) => {
	if (!dictionaryObjectKeys) return null;
	const keys = Object.keys(dictionaryObjectKeys).sort(
		(a, b) => b.length - a.length,
	);

	// ES2026 RegExp.escape
	return {
		regex: new RegExp(
			`\\b(${keys.map((i) => RegExp.escape(i)).join("|")})\\b`,
			"gi",
		),
		dictionary: dictionaryObjectKeys,
	};
};

export const translateDictionary = (translator, str) => {
	if (!str || !translator) return "";

	return str.replace(
		translator.regex,
		(matched) => translator.dictionary[matched.toUpperCase()],
	);
};

export const getBrowserInfo = () => {
	const ua = navigator.userAgent;

	if (/edg/i.test(ua)) return "edge";
	if (/firefox|fxios/i.test(ua)) return "firefox";
	if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) return "chrome";
	if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return "safari";
	if (/opr\//i.test(ua)) return "opera";

	return "unknown";
};
