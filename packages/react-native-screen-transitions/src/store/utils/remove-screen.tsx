import { ScreenStore } from "..";

export const removeScreen = (key: string | undefined) => {
	if (!key) return;
	ScreenStore.use.setState(({ screens, screenKeys }) => {
		delete screens[key];

		const indexToRemove = screenKeys.indexOf(key);
		if (indexToRemove > -1) {
			screenKeys.splice(indexToRemove, 1);
		}
	});
};
