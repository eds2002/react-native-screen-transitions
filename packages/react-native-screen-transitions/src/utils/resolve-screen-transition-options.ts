import { DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR } from "../constants";
import type {
	ScreenTransitionConfig,
	SheetScrollGestureBehavior,
} from "../types/screen.types";

export const resolveSheetScrollGestureBehavior = (
	options: Pick<ScreenTransitionConfig, "sheetScrollGestureBehavior">,
): SheetScrollGestureBehavior => {
	return (
		options.sheetScrollGestureBehavior ?? DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR
	);
};
