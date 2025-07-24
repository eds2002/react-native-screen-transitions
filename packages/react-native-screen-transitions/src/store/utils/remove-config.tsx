import { ConfigStore } from "../config-store";

export const removeConfig = (key: string | undefined) => {
	if (!key) return;
	ConfigStore.use.setState(({ screens, screenKeys }) => {
		delete screens[key];

		const indexToRemove = screenKeys.indexOf(key);
		if (indexToRemove > -1) {
			screenKeys.splice(indexToRemove, 1);
		}
	});
};
