import { getBrowserInfo } from "./process/util";

const CURRENT_BROWSER = getBrowserInfo();

export const TABLE_TITLE_ROWS = () => {
	switch (CURRENT_BROWSER) {
		case "firefox":
			return 18;
		default:
			return 18;
	}
};
export const MAX_ROWS_PER_PAGE = () => {
	switch (CURRENT_BROWSER) {
		case "firefox":
			return 65;
		default:
			return 65;
	}
};
