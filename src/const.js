import { getBrowserInfo } from "./process/util";

const CURRENT_BROWSER = getBrowserInfo();

export const TABLE_TITLE_ROWS = () => {
	switch (CURRENT_BROWSER) {
		case "firefox":
			return 10;
		default:
			return 10;
	}
};

export const MAX_ROWS_PER_PAGE = () => {
	switch (CURRENT_BROWSER) {
		case "firefox":
			return 70;
		default:
			return 63;
	}
};
