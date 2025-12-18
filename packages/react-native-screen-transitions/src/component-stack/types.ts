import type { DerivedValue } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "../shared";
import type {
	OverlayInterpolationProps,
	ScreenInterpolationProps,
} from "../shared/types/animation.types";

/**
 * A synthetic route object for component navigation.
 * Mimics React Navigation's Route type but without the navigation dependency.
 */
export interface ComponentRoute<Params = Record<string, unknown>> {
	/** Unique identifier for this route instance */
	key: string;
	/** Name identifier for the screen */
	name: string;
	/** Optional parameters passed to the screen */
	params?: Params;
}

/**
 * Navigation action for dispatch method.
 */
type ComponentNavigationAction =
	| { type: "PUSH"; name: string; params?: Record<string, unknown> }
	| { type: "POP" }
	| { type: "POP_BY_KEY"; key: string }
	| { type: "NAVIGATE"; name: string; params?: Record<string, unknown> }
	| { type: "RESET"; name?: string; params?: Record<string, unknown> }
	| { type: string; source?: string; target?: string; payload?: unknown };

/**
 * Navigation object provided to screens and available via useComponentNavigation hook.
 */
export interface ComponentNavigation {
	/** Push a new screen by name */
	push: (name: string, params?: Record<string, unknown>) => void;
	/** Pop the current screen */
	pop: () => void;
	/** Navigate back (alias for pop) */
	goBack: () => void;
	/** Navigate to a specific screen by name, reusing existing if present */
	navigate: (name: string, params?: Record<string, unknown>) => void;
	/** Check if we can go back */
	canGoBack: () => boolean;
	/** Reset to a specific screen or initial state */
	reset: (name?: string, params?: Record<string, unknown>) => void;
	/** Dispatch a navigation action (compatible with React Navigation's StackActions) */
	dispatch: (action: ComponentNavigationAction) => void;
	/** Get current navigation state (for gesture handling compatibility) */
	getState: () => ComponentStackState;
	/** Current index in the stack */
	index: number;
}

/**
 * Screen options for component stack, extending the base transition config.
 */
export type ComponentStackScreenTransitionConfig = ScreenTransitionConfig & {
	/**
	 * Whether to detach the previous screen from the view hierarchy to save memory.
	 * Set it to `false` if you need the previous screen to be seen through the active screen.
	 */
	detachPreviousScreen?: boolean;
};

/**
 * Props passed to overlay components.
 */
export type ComponentStackOverlayProps = {
	/** Route of the currently focused screen in the stack. */
	focusedRoute: ComponentRoute;
	/** Index of the focused route in the stack. */
	focusedIndex: number;
	/** All routes currently in the stack. */
	routes: ComponentRoute[];
	/** Custom metadata from the focused screen's options. */
	meta?: Record<string, unknown>;
	/** Navigation object for the overlay. */
	navigation: ComponentNavigation;
	/** Animation values for the overlay. */
	overlayAnimation: DerivedValue<OverlayInterpolationProps>;
	/** Animation values for the screen. */
	screenAnimation: DerivedValue<ScreenInterpolationProps>;
};

/**
 * Full navigation options for a component stack screen.
 */
export type ComponentStackNavigationOptions =
	ComponentStackScreenTransitionConfig & {
		/** Function that given OverlayProps returns a React Element to display as overlay. */
		overlay?: (props: ComponentStackOverlayProps) => React.ReactNode;
		/**
		 * Layout: How the Overlay is positioned
		 * - 'float': Single persistent overlay above all screens (like iOS)
		 * - 'screen': Per-screen overlay that transitions with content
		 * @default 'screen'
		 */
		overlayMode?: "float" | "screen";
		/** Whether to show the overlay. Defaults to true when overlay is provided. */
		overlayShown?: boolean;
		/**
		 * Whether inactive screens should be suspended from re-rendering.
		 * Defaults to `true` when `enableFreeze()` is run at the top of the application.
		 */
		freezeOnBlur?: boolean;
	};

/**
 * Descriptor for a component stack screen.
 * Similar to React Navigation's Descriptor but simplified.
 */
export interface ComponentStackDescriptor {
	/** The route object for this screen */
	route: ComponentRoute;
	/** Navigation object */
	navigation: ComponentNavigation;
	/** Render function for the screen content */
	render: () => React.JSX.Element | null;
	/** Screen options/configuration */
	options: ComponentStackNavigationOptions;
}

/**
 * A scene in the component stack (route + descriptor pair).
 */
export interface ComponentStackScene {
	route: ComponentRoute;
	descriptor: ComponentStackDescriptor;
}

/**
 * Map of route keys to descriptors.
 */
export type ComponentStackDescriptorMap = {
	[key: string]: ComponentStackDescriptor;
};

/**
 * Props passed to screen components.
 */
export interface ComponentStackScreenProps<Params = Record<string, unknown>> {
	/** Navigation object for controlling the stack */
	navigation: ComponentNavigation;
	/** Route object with params */
	route: ComponentRoute<Params>;
}

/**
 * State of the component navigation stack.
 */
export interface ComponentStackState {
	/** All routes in the stack */
	routes: ComponentRoute[];
	/** Index of the currently focused route */
	index: number;
	/** Unique key for this stack instance */
	key: string;
}

/**
 * Screen definition for the component navigator.
 */
export interface ComponentScreenConfig {
	/** Unique name for this screen */
	name: string;
	/** Component to render for this screen */
	component: React.ComponentType<ComponentStackScreenProps<any>>;
	/** Screen-specific options */
	options?: ComponentStackNavigationOptions;
}

/**
 * Props for the ComponentNavigator component.
 */
export interface ComponentNavigatorProps {
	/** Screen definitions */
	children: React.ReactNode;
	/** Initial screen name to display */
	initialRouteName?: string;
	/** Default options applied to all screens */
	screenOptions?: ComponentStackNavigationOptions;
}

/**
 * Props for the ComponentScreen component.
 */
export interface ComponentScreenProps {
	/** Unique name for this screen */
	name: string;
	/** Component to render */
	component: React.ComponentType<ComponentStackScreenProps<any>>;
	/** Screen-specific options */
	options?: ComponentStackNavigationOptions;
}
