import type { Any } from "../../types";
import { ScreenStore } from "..";

export const updateScreen = (key: string | undefined, value: Any) => {
	if (!key) return;

	ScreenStore.use.setState(({ screenKeys, screens }) => {
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
