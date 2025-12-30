import type { Route } from "@react-navigation/native";
import type { DerivedValue } from "react-native-reanimated";
import type {
	OverlayInterpolationProps,
	ScreenInterpolationProps,
} from "./animation.types";
import type { ScreenTransitionConfig } from "./screen.types";

/**
 * @deprecated Overlay mode is no longer needed. Overlays now always render as "float" mode.
 * For per-screen overlays, render an absolute-positioned view directly in your screen component
 * and use `useScreenAnimation()` to access animation values.
 */
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
	 * Screen options for the currently focused screen.
	 */
	options: ScreenTransitionConfig;

	/**
	 * Stack progress relative to the overlay's position.
	 * This is equivalent to `useScreenAnimation().stackProgress`.
	 */
	progress: DerivedValue<number>;

	/**
	 * Animation values for the overlay.
	 *
	 * @deprecated Use `progress` prop or `useScreenAnimation()` instead.
	 * This prop will be removed in a future version.
	 */
	overlayAnimation: DerivedValue<OverlayInterpolationProps>;

	/**
	 * Animation values for the screen.
	 *
	 * @deprecated Use `useScreenAnimation()` hook directly instead.
	 * This prop will be removed in a future version.
	 */
	screenAnimation: DerivedValue<ScreenInterpolationProps>;
};
