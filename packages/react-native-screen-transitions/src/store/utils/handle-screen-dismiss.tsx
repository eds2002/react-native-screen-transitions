import { StackActions } from "@react-navigation/native";
import type { UseNavigation } from "../../types";
import { ScreenStore } from "..";

export const handleScreenDismiss = (
	screenBeingDismissed: string,
	navigation: UseNavigation,
) => {
	const { screens } = ScreenStore.use.getState();
	const dismissedScreen = screens[screenBeingDismissed];

	if (!dismissedScreen) {
		navigation.goBack();
		return;
	}

	const childScreens = Object.values(screens).filter(
		(screen) => screen.parentNavigatorKey === dismissedScreen.navigatorKey,
	);

	if (childScreens.length > 0) {
		ScreenStore.updateScreen(dismissedScreen.id, {
			closing: true,
		});

		navigation.dispatch(StackActions.pop(childScreens.length));
	} else {
		navigation.goBack();
	}
};
