import type { SharedValue } from "react-native-reanimated";
import type {
	ComponentNavigation,
	ComponentRoute,
	ComponentStackDescriptorMap,
	ComponentStackScene,
	ComponentStackState,
} from "../../types";

export interface ComponentNavigationContextValue {
	routes: ComponentRoute[];
	descriptors: ComponentStackDescriptorMap;
	scenes: ComponentStackScene[];
	activeScreensLimit: number;
	closingRouteKeysShared: SharedValue<string[]>;
	handleCloseRoute: (payload: { route: ComponentRoute }) => void;
	shouldShowFloatOverlay: boolean;
	focusedIndex: number;
	navigation: ComponentNavigation;
}

export interface ComponentNavigationContextProps {
	state: ComponentStackState;
	descriptors: ComponentStackDescriptorMap;
	navigation: ComponentNavigation;
}
