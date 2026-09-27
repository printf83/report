import sampleTelahHadirCSG from "./csv/sample/csgAttend.csv?raw";
import sampleKeputusanPermohonanTapisan from "./csv/sample/vettingResult.csv?raw";
import sampleSedangMemohonTapisan from "./csv/sample/vettingRequest.csv?raw";
import sampleLocation from "./csv/sample/location.csv?raw";

import correction from "./csv/correction.csv?raw";
import location from "./csv/location.csv?raw";

export const data = {
	correction: String(correction).replace(
		"%VITE_SOURCE_UC%",
		import.meta.env.VITE_SOURCE_UC,
	),
	location,
	item: [
		{
			company: "COMPANY",
			csgAttend: sampleTelahHadirCSG,
			vettingResult: sampleKeputusanPermohonanTapisan,
			vettingRequest: sampleSedangMemohonTapisan,
			location: sampleLocation,
		},
	],
};
