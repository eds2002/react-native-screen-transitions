import type { ScreenStateStore } from "../types";
import {
	createVanillaStore,
	handleScreenDismiss,
	removeScreen,
	shouldSkipPreventDefault,
	updateScreen,
} from "./utils";

const useScreenStore = createVanillaStore<ScreenStateStore>({
	screens: {},
	screenKeys: [],
});

export const ScreenStore = {
	use: useScreenStore,
	updateScreen,
	removeScreen,
	handleScreenDismiss,
	shouldSkipPreventDefault,
};
