import { DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR } from "../constants";
import type {
	ScreenTransitionConfig,
	SheetScrollGestureBehavior,
} from "../types/screen.types";

export const resolveSheetScrollGestureBehavior = (
	options: Pick<
		ScreenTransitionConfig,
		"sheetScrollGestureBehavior" | "expandViaScrollView"
	>,
): SheetScrollGestureBehavior => {
	const explicitBehavior = options.sheetScrollGestureBehavior;
	if (explicitBehavior) return explicitBehavior;

	const legacyBehavior = options.expandViaScrollView;
	if (legacyBehavior !== undefined) {
		return legacyBehavior ? "expand-and-collapse" : "collapse-only";
	}

	return DEFAULT_SHEET_SCROLL_GESTURE_BEHAVIOR;
};
