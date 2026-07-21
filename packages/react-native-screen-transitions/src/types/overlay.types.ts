import type { Route } from "@react-navigation/native";
import type { DerivedValue } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "./screen.types";

/**
 * Props passed to overlay components.
 * Generic over the navigation type since different stacks have different navigation props.
 */
/**
 * Overlay screen state passed to overlay host for rendering.
 * Generic over navigation type — defaults to `unknown` for flexibility.
 */
export type OverlayScreenState<TNavigation = unknown> = Omit<
	OverlayProps<TNavigation>,
	"progress"
> & {
	index: number;
	snapTo: (index: number) => void;
};

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
};
