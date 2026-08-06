import type {
	ParamListBase,
	ParamListRoute,
	RouteProp,
} from "@react-navigation/native";
import type { ReactNode } from "react";
import type { DerivedValue } from "react-native-reanimated";
import type { UntypedScreenMeta } from "./meta.types";
import type { ScreenTransitionConfig } from "./screen.types";

/**
 * Overlay state without the animated progress value.
 */
export type OverlayScreenState<
	TNavigation = unknown,
	TMeta extends object = UntypedScreenMeta,
	TParamList extends ParamListBase = ParamListBase,
	TOwnerRouteName extends keyof TParamList = keyof TParamList,
> = Omit<
	OverlayProps<TNavigation, TMeta, TParamList, TOwnerRouteName>,
	"progress"
> & {
	snapTo: (index: number) => void;
};

/**
 * Props passed to a floating overlay component.
 *
 * `route` and `index` identify the screen that owns the overlay. Focused
 * values may describe a later screen while that overlay remains visible.
 */
export type OverlayProps<
	TNavigation = unknown,
	TMeta extends object = UntypedScreenMeta,
	TParamList extends ParamListBase = ParamListBase,
	TOwnerRouteName extends keyof TParamList = keyof TParamList,
> = {
	/** Route that declared this overlay. */
	route: RouteProp<TParamList, TOwnerRouteName>;

	/** Index of the route that declared this overlay. */
	index: number;

	/**
	 * Route of the currently focused screen in the stack.
	 */
	focusedRoute: ParamListRoute<TParamList>;

	/**
	 * Index of the focused route in the stack.
	 */
	focusedIndex: number;

	/**
	 * All routes currently in the stack.
	 */
	routes: ParamListRoute<TParamList>[];

	/**
	 * Custom metadata from the focused screen's options.
	 */
	meta?: TMeta;

	/**
	 * Navigation prop for the overlay.
	 */
	navigation: TNavigation;

	/**
	 * Screen options for the currently focused screen.
	 */
	options: ScreenTransitionConfig<TMeta>;

	/**
	 * Stack progress relative to the overlay's position.
	 * This is equivalent to `useScreenAnimation().stackProgress`.
	 */
	progress: DerivedValue<number>;
};

/**
 * Component rendered for a floating screen overlay.
 *
 * The callback is bivariant because React Navigation stores overlay components
 * in navigator-wide screen options while applications annotate them for one
 * specific route.
 */
export type OverlayComponent<TMeta extends object = UntypedScreenMeta> = {
	bivarianceHack(props: OverlayProps<unknown, TMeta>): ReactNode;
}["bivarianceHack"];
