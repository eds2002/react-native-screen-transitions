import type { Any } from "../../types";
import { ConfigStore } from "../config-store";

export const updateConfig = (key: string | undefined, value: Any) => {
	if (!key) return;

	ConfigStore.use.setState(({ screenKeys, screens }) => {
		const currentScreen = screens[key];

		if (currentScreen) {
			screens[key] = {
				...currentScreen,
				...value,
			};
		} else {
			const { name = "", status = 0, closing = false, ...rest } = value;

			const newIndex = screenKeys.length;

			screens[key] = {
				id: key,
				index: newIndex,
				name,
				status,
				closing,
				...rest,
			};

			screenKeys.push(key);
		}
	});
};
