import type { Any } from "../../types";
import { ConfigStore } from "../config-store";

export const shouldSkipPreventDefault = (
	key: string | undefined,
	navigatorState: Any,
) => {
	if (!key) return false;

	const { screens } = ConfigStore.use.getState();
	const currentScreen = screens[key];

	// We don't want to block the navigation event when the parent navigator holds the screen transition ( prevents delay in the back event )
	const isLastScreenInStack =
		navigatorState.routes.length === 1 && navigatorState.routes[0].key === key;

	// Child screens should be instantly dismissed when the parent navigator is closing. This prevents transparent modals from lingering. (Only happens when using deeply nested screen transitions)
	const isParentNavigatorExiting = Boolean(
		currentScreen?.parentNavigatorKey &&
			Object.values(screens).some(
				(screen) =>
					screen.navigatorKey === currentScreen.parentNavigatorKey &&
					screen.closing,
			),
	);

	return isLastScreenInStack || isParentNavigatorExiting;
};
