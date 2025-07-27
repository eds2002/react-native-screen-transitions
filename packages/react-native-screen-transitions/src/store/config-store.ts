import { type ParamListBase, StackActions } from "@react-navigation/native";
import type {
	Any,
	ScreenStateStore,
	TransitionStackNavigationProp,
	UseNavigation,
} from "@/types";
import { BoundStore } from "./bound-store";
import { GestureStore } from "./gesture-store";
import { ScreenProgressStore } from "./screen-progress";
import { createVanillaStore } from "./utils";
import { animateScreenProgress } from "./utils/animate-screen-progress";

const useConfigStore = createVanillaStore<ScreenStateStore>({
	screens: {},
	screenKeys: [],
});

const updateConfig = (key: string | undefined, value: Any) => {
	if (!key) return;

	useConfigStore.setState(({ screenKeys, screens }) => {
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

const shouldSkipPreventDefault = (
	key: string | undefined,
	navigatorState: Any,
) => {
	if (!key) return false;

	const { screens } = useConfigStore.getState();
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

const removeConfig = (key: string | undefined) => {
	if (!key) return;
	useConfigStore.setState(({ screens, screenKeys }) => {
		delete screens[key];

		const indexToRemove = screenKeys.indexOf(key);
		if (indexToRemove > -1) {
			screenKeys.splice(indexToRemove, 1);
		}
	});
};

const handleConfigDismiss = (
	screenBeingDismissed: string,
	navigation: TransitionStackNavigationProp<ParamListBase, string, undefined>,
) => {
	const { screens } = useConfigStore.getState();
	const dismissedScreen = screens[screenBeingDismissed];

	if (!dismissedScreen) {
		navigation.goBack();
		return;
	}

	const childScreens = Object.values(screens).filter(
		(screen) => screen.parentNavigatorKey === dismissedScreen.navigatorKey,
	);

	if (childScreens.length > 0) {
		updateConfig(dismissedScreen.id, {
			closing: true,
		});

		navigation.dispatch(StackActions.pop(childScreens.length));
	} else {
		navigation.goBack();
	}
};

export const ConfigStore = {
	use: useConfigStore,
	updateConfig,
	removeConfig,
	handleConfigDismiss,
	shouldSkipPreventDefault,
};

useConfigStore.subscribeWithSelector(
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
			BoundStore.deleteScreenBounds(removedKey);
		}

		for (const changedKey of changedKeys) {
			const currentScreen = currScreens[changedKey];
			if (currentScreen) {
				animateScreenProgress(currentScreen);
			}
		}
	},
);
