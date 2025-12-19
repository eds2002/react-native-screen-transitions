import type { Route } from "@react-navigation/native";
import type { DerivedValue } from "react-native-reanimated";
import type {
	OverlayInterpolationProps,
	ScreenInterpolationProps,
} from "./animation.types";

export type OverlayMode = "float" | "screen";

/**
 * Props passed to overlay components.
 * Generic over the navigation type since different stacks have different navigation props.
 */
export type OverlayProps<TNavigation = unknown> = {
	/**
	 * Route of the currently focused screen in the stack.
	 */
	focusedRoute: Route<string>;

	/**
	 * Index of the focused route in the stack.
	 */
	focusedIndex: number;

	/**
	 * All routes currently in the stack.
	 */
	routes: Route<string>[];

	/**
	 * Custom metadata from the focused screen's options.
	 */
	meta?: Record<string, unknown>;

	/**
	 * Navigation prop for the overlay.
	 */
	navigation: TNavigation;

	/**
	 * Animation values for the overlay.
	 */
	overlayAnimation: DerivedValue<OverlayInterpolationProps>;

	/**
	 * Animation values for the screen.
	 */
	screenAnimation: DerivedValue<ScreenInterpolationProps>;
};
