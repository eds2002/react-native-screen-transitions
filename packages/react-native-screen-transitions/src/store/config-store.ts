import type { ScreenStateStore } from "../types";
import { GestureStore } from "./gesture-store";
import { ScreenProgressStore } from "./screen-progress";
import {
	createVanillaStore,
	handleConfigDismiss,
	removeConfig,
	shouldSkipPreventDefault,
	updateConfig,
} from "./utils";
import { animateScreenProgress } from "./utils/animate-screen-progress";

const useConfigStore = createVanillaStore<ScreenStateStore>({
	screens: {},
	screenKeys: [],
});

export const ConfigStore = {
	use: useConfigStore,
	updateConfig,
	removeConfig,
	handleConfigDismiss,
	shouldSkipPreventDefault,
};

ConfigStore.use.subscribeWithSelector(
	(state) => state.screens,
	(currScreens, prevScreens) => {
		const currKeys = Object.keys(currScreens);
		const prevKeys = Object.keys(prevScreens);

		const incomingKeys = currKeys.filter((k) => !prevKeys.includes(k));
		const removedKeys = prevKeys.filter((k) => !currKeys.includes(k));
		const changedKeys = currKeys.filter(
			(k) => currScreens[k] !== prevScreens[k],
		);

		for (const incomingKey of incomingKeys) {
			ScreenProgressStore.initAllForScreen(incomingKey);
			GestureStore.initAllForScreen(incomingKey);
		}

		for (const removedKey of removedKeys) {
			GestureStore.removeAllForScreen(removedKey);
			ScreenProgressStore.removeAllForScreen(removedKey);
		}

		for (const changedKey of changedKeys) {
			const currentScreen = currScreens[changedKey];
			if (currentScreen) {
				animateScreenProgress(currentScreen);
			}
		}
	},
);
