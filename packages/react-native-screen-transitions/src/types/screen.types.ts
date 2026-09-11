import type { ComponentType, ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { AnimatedProps } from "react-native-reanimated";
import type {
	ScreenStyleInterpolator,
	TransitionSpec,
} from "./animation.types";
import type {
	GestureDirectionOption,
	ScrollMetadataState,
} from "./gesture.types";
import type { OverlayComponent } from "./overlay.types";

export type Layout = {
	width: number;
	height: number;
};

export type ScreenLayouts = {
	/**
	 * The `width` and `height` of the screen container.
	 */
	screen: Layout;
	/**
	 * The intrinsic measured content wrapper layout when available.
	 *
	 * This is currently populated for the measured screen-container path used by
	 * auto snap-point sizing. It is undefined until a real measurement exists.
	 */
	content?: Layout;
	/**
	 * Scroll metadata from the primary transition-aware scrollable on this screen.
	 *
	 * For nested same-axis scrollables, the outermost scrollable owns that axis.
	 * Cross-axis nested scrollables can each publish their own axis.
	 */
	scroll?: ScrollMetadataState;
};

export type ScreenKey = string;
export type SheetScrollGestureBehavior =
	| "expand-and-collapse"
	| "collapse-only";

/**
 * Controls how a drag moves between configured {@linkcode ScreenTransitionConfig.snapPoints}.
 *
 * - `"continuous"` maps physical movement directly to global screen progress.
 * - `"step"` maps each drag across one adjacent snap interval.
 *
 * @see {@linkcode ScreenTransitionConfig.sheetSnapBehavior}
 */
export type SheetSnapBehavior = "continuous" | "step";
export type GestureTracking = "auto" | "never" | "always";

/**
 * A single snap point value. Either a fraction of screen height (0–1) or
 * `'auto'` to snap to the intrinsic height of the screen content.
 */
export type SnapPoint = number | "auto" | (string & {});

export type BackdropBehavior = "block" | "passthrough" | "dismiss" | "collapse";

/**
 * Props passed to custom screen layer component renderers such as
 * {@linkcode ScreenTransitionConfig.backdropComponent}.
 */
export type ScreenLayerComponentProps = {
	/**
	 * Animated styles for the target layer, including the library-owned base
	 * layout style for that layer.
	 */
	styles: AnimatedProps<ViewProps>["style"];

	/**
	 * Animated props resolved from the matching `screenStyleInterpolator` slot.
	 */
	props: AnimatedProps<Record<string, unknown>>["animatedProps"];

	/**
	 * Pointer-event behavior resolved for the current layer state.
	 */
	pointerEvents: ViewProps["pointerEvents"];
};

/**
 * Props passed to {@linkcode ScreenTransitionConfig.backdropComponent} when it
 * is provided as a render-style component.
 */
export type ScreenBackdropComponentProps = ScreenLayerComponentProps;

/**
 * Props passed to {@linkcode ScreenTransitionConfig.contentComponent} when it
 * is provided as a render-style component.
 */
export type ScreenContentComponentProps = ScreenLayerComponentProps & {
	/**
	 * The screen subtree rendered inside the content layer.
	 */
	children: ReactNode;
};

/**
 * Props passed to {@linkcode ScreenTransitionConfig.surfaceComponent} when it
 * is provided as a render-style component.
 */
export type ScreenSurfaceComponentProps = ScreenLayerComponentProps & {
	/**
	 * The screen subtree rendered inside the visual surface layer.
	 */
	children: ReactNode;
};

/**
 * Custom renderer for the backdrop layer.
 *
 * Component types such as `BlurView` are still accepted for compatibility.
 * Function components can also receive {@linkcode ScreenBackdropComponentProps}
 * to render the animated styles and props manually.
 *
 * @see {@linkcode ScreenTransitionConfig.backdropComponent}
 */
export type ScreenBackdropComponent =
	| ComponentType<any>
	| ComponentType<ScreenBackdropComponentProps>;

/**
 * Custom renderer for the screen content layer.
 *
 * Component types such as a custom native view are accepted directly. Function
 * components can also receive {@linkcode ScreenContentComponentProps} to render
 * the animated styles, props, pointer-events, and children manually.
 *
 * @see {@linkcode ScreenTransitionConfig.contentComponent}
 */
export type ScreenContentComponent =
	| ComponentType<any>
	| ComponentType<ScreenContentComponentProps>;

/**
 * Custom renderer for the screen's visual surface layer.
 *
 * The surface is nested inside the content layer and does not contain the
 * shared-element fallback host. Use it for visual effects such as filters,
 * clipping, backgrounds, and corner treatments without changing navigation
 * geometry.
 *
 * @see {@linkcode ScreenTransitionConfig.surfaceComponent}
 */
export type ScreenSurfaceComponent =
	| ComponentType<any>
	| ComponentType<ScreenSurfaceComponentProps>;

/**
 * Controls how an inactive screen is retained after it is no longer active.
 *
 * - `hide`
 *   keep inactive screen mounted, pause/freeze inactive work where supported,
 *   and hide inactive paint/native presentation after safe paint
 *   RNS: activityState=0, visible=false, shouldFreeze=true
 *   React Activity: mode="hidden" with paint hidden
 *
 * - `pause`
 *   keep last painted UI visible but pause/freeze inactive work where supported
 *   RNS: activityState=1, visible=true, shouldFreeze=true
 *   React Activity: mode="hidden" with paint preserved
 *
 * - `unmount`
 *   remove React subtree when the inactive screen is safe to remove
 *   RNS native: only after safe paint for non-nested screens
 *   web: return null
 *
 * - `keep`
 *   keep inactive screen mounted, attached, visible, not interactive, and running
 *   RNS: activityState=1, visible=true
 *   React Activity: mode="visible"
 */
export type InactiveBehavior = "hide" | "pause" | "unmount" | "keep";

export type TransitionAwareProps<T extends object> = AnimatedProps<T> & {
	/**
	 * Connects this component to custom animated styles defined in screenStyleInterpolator.
	 *
	 * When you return custom styles from your interpolator with a matching key,
	 * those styles will be applied to this component during transitions.
	 *
	 * @example
	 * // In your component:
	 * <Transition.View styleId="hero-image">
	 *   <Image source={...} />
	 * </Transition.View>
	 *
	 * // In your screenStyleInterpolator:
	 * screenStyleInterpolator: ({ progress }) => {
	 *   "worklet";
	 *   return {
	 *     'hero-image': {
	 *       opacity: interpolate(progress, [0, 1], [0, 1]),
	 *       transform: [{ scale: interpolate(progress, [0, 1], [0.8, 1]) }]
	 *     }
	 *   }
	 * }
	 */
	styleId?: string;
};

export type ScreenTransitionConfig = {
	/**
	 * Globally identifies this mounted screen for keyed animation observation.
	 *
	 * The key must be unique among mounted screens.
	 *
	 * @example
	 * options={{ transitionKey: "feed" }}
	 */
	transitionKey?: string;

	/**
	 * The user-provided function to calculate styles based on animation progress.
	 *
	 * Return `null`, `undefined`, or `{}` to apply no transition styles for the
	 * current frame.
	 */
	screenStyleInterpolator?: ScreenStyleInterpolator;

	/**
	 * The Reanimated animation config for opening and closing transitions.
	 */
	transitionSpec?: TransitionSpec;

	/** @deprecated Ignored. Return `clip` from the interpolator to enable clipping. */
	navigationMaskEnabled?: boolean;

	/**
	 * Controls whether swipe-to-dismiss is enabled.
	 *
	 * For screens with `snapPoints`, gesture-driven snapping between non-dismiss
	 * snap points remains available even when this is `false`.
	 */
	gestureEnabled?: boolean;

	/**
	 * Controls whether the screen tracks live gesture values.
	 *
	 * - `"auto"` tracks gestures when dismissal is enabled, or when snap points
	 *   can move without dismissal.
	 * - `"never"` disables gesture tracking for the screen.
	 * - `"always"` keeps tracking live gesture values even when
	 *   `gestureEnabled` is `false`, without allowing dismiss.
	 *
	 * @default "auto"
	 */
	gestureTracking?: GestureTracking;

	/**
	 * The direction(s) of the screen gesture used to dismiss the screen.
	 *
	 * Supports pan directions (`horizontal`, `vertical`, etc.) and pinch
	 * directions (`pinch-in`, `pinch-out`).
	 *
	 * Pan directions may be configured with an activation area:
	 * `[{ gesture: "vertical", area: "edge" }]`.
	 */
	gestureDirection?: GestureDirectionOption;

	/**
	 * Controls how directly live gesture movement maps into transition progress
	 * and the non-raw gesture values exposed to interpolators.
	 *
	 * Lower values feel less sensitive, higher values feel more responsive. If
	 * an interpolator needs physical gesture input before sensitivity is applied,
	 * read from `active.gesture.raw`.
	 *
	 * @default 1
	 */
	gestureSensitivity?: number;

	/**
	 * How much the gesture's final velocity impacts the dismiss decision.
	 * @default 0.3
	 */
	gestureVelocityImpact?: number;

	/**
	 * How much velocity affects snap point targeting. Lower values make snapping
	 * feel more deliberate (iOS-like), higher values make it more responsive to flicks.
	 *
	 * @default 0.1
	 */
	gestureSnapVelocityImpact?: number;

	/**
	 * Multiplies gesture release velocity used for gesture reset/handoff energy.
	 *
	 * This does NOT affect dismissal threshold decisions (`gestureVelocityImpact`)
	 * or snap target selection (`gestureSnapVelocityImpact`). It changes the release
	 * impulse used by gesture values and interpolator handoff values.
	 *
	 * @default 1
	 */
	gestureReleaseVelocityScale?: number;

	/**
	 * Custom metadata passed through to animation props.
	 *
	 * @example
	 * options={{ meta: { scalesOthers: true } }}
	 */
	meta?: Record<string, unknown>;

	/**
	 * Function that returns a React Element to display as an overlay.
	 */
	overlay?: OverlayComponent;

	/**
	 * Whether to show the overlay. The overlay is shown by default when `overlay` is provided.
	 * Setting this to `false` hides the overlay.
	 */
	overlayShown?: boolean;

	/**
	 * Forces the display to run at its maximum refresh rate during screen transitions.
	 * Prevents iOS/Android from throttling to 60fps for battery savings.
	 *
	 * Useful for smoother animations on high refresh rate displays (90/120/144Hz).
	 * Note: Increases battery usage while active.
	 *
	 * @experimental This API may change in future versions.
	 * @default false
	 */
	experimental_enableHighRefreshRate?: boolean;

	/**
	 * Animates the first screen in a navigator from its closed state on initial mount
	 * instead of snapping directly to its settled progress.
	 *
	 * Useful for launch/onboarding flows where the initial screen should participate
	 * in the same transition system as pushed screens.
	 *
	 * @experimental This API may change in future versions.
	 * @default false
	 */
	experimental_animateOnInitialMount?: boolean;

	/**
	 * Describes heights where a screen can rest, as fractions of screen height,
	 * or `'auto'` to snap to the intrinsic height of the screen content.
	 *
	 * Pass an array of ascending values from 0 to 1, or `'auto'`.
	 * The `'auto'` value measures the content's natural height after layout and
	 * converts it to the equivalent fraction of the screen height.
	 *
	 * @example
	 * snapPoints={[0.5, 1.0]}     // 50% and 100% of screen height
	 * snapPoints={['auto']}       // snap to content height
	 * snapPoints={['auto', 1.0]}  // content height or full screen
	 *
	 * @default [1.0]
	 */
	snapPoints?: SnapPoint[];

	/**
	 * The initial snap point index when the screen opens.
	 *
	 * @default 0
	 */
	initialSnapIndex?: number;

	/**
	 * Controls how nested scroll content hands gestures off to a snap sheet.
	 *
	 * - `"expand-and-collapse"` (Apple Maps style): Swiping up at scroll boundary expands the sheet,
	 *   and swiping down at scroll boundary collapses or dismisses it
	 * - `"collapse-only"` (Instagram style): Expand only works via deadspace; collapse/dismiss via
	 *   nested scroll content still works at boundary
	 *
	 * Only applies to screens with `snapPoints` configured.
	 *
	 * @default "expand-and-collapse"
	 */
	sheetScrollGestureBehavior?: SheetScrollGestureBehavior;

	/**
	 * Controls how gesture movement maps between adjacent snap points.
	 *
	 * `"continuous"` preserves direct global progress and permits one gesture to
	 * cross multiple snap points. `"step"` gives every adjacent interval a full
	 * normalized drag range and limits the gesture to one snap-point step.
	 *
	 * @default "continuous"
	 */
	sheetSnapBehavior?: SheetSnapBehavior;

	/**
	 * Locks gesture-based snap movement to the current snap point.
	 *
	 * When enabled, users cannot gesture between snap points. If dismiss gestures
	 * are allowed (`gestureEnabled !== false`), swipe-to-dismiss still works.
	 * Programmatic `snapTo()` calls are not affected.
	 *
	 * @default false
	 */
	gestureSnapLocked?: boolean;

	/**
	 * Controls how touches interact with the backdrop area (outside the screen content).
	 *
	 * - `'block'`: Backdrop catches all touches (default for most screens)
	 * - `'passthrough'`: Touches pass through to content behind (default for component stacks)
	 * - `'dismiss'`: Tapping backdrop dismisses the screen
	 * - `'collapse'`: Tapping backdrop collapses to next lower snap point (dismisses at min)
	 *
	 * @default 'block' (or 'passthrough' for component stacks)
	 */
	backdropBehavior?: BackdropBehavior;

	/**
	 * Custom component to render as the backdrop layer (between screens).
	 *
	 * Direct component types are wrapped with `Animated.createAnimatedComponent`
	 * internally. Function components can receive `{ styles, props, pointerEvents }`
	 * and decide how to render the layer. Animated styles and props are driven by
	 * the `backdrop` slot in the interpolator return value.
	 *
	 * `backdropBehavior` still controls the wrapping Pressable for dismiss/collapse handling.
	 *
	 * @example
	 * backdropComponent: ({ styles, props, pointerEvents }) => (
	 *   <AnimatedBlurView
	 *     style={styles}
	 *     animatedProps={props}
	 *     pointerEvents={pointerEvents}
	 *   />
	 * ),
	 * screenStyleInterpolator: ({ progress }) => {
	 *   "worklet";
	 *   return {
	 *     backdrop: {
	 *       style: { opacity: interpolate(progress, [0, 1], [0, 1]) },
	 *       props: { intensity: interpolate(progress, [0, 1], [0, 80]) },
	 *     },
	 *   };
	 * }
	 *
	 * @default undefined
	 */
	backdropComponent?: ScreenBackdropComponent;

	/**
	 * Custom component to render as the screen's content layer.
	 *
	 * The component receives the `content` slot's animated styles and props. A
	 * direct component type is wrapped with `Animated.createAnimatedComponent`;
	 * a function component can receive `{ styles, props, pointerEvents, children }`
	 * and decide how to render the layer.
	 *
	 * @example
	 * contentComponent: ({ styles, props, pointerEvents, children }) => (
	 *   <AnimatedSquircleView
	 *     style={styles}
	 *     animatedProps={props}
	 *     pointerEvents={pointerEvents}
	 *   >
	 *     {children}
	 *   </AnimatedSquircleView>
	 * )
	 *
	 * @default undefined
	 */
	contentComponent?: ScreenContentComponent;

	/**
	 * Custom component to render as the screen's visual surface layer.
	 *
	 * The component receives the `surface` slot's animated styles and props. It
	 * is nested inside the content layer while shared-element fallback content
	 * remains outside it.
	 *
	 * @default undefined
	 */
	surfaceComponent?: ScreenSurfaceComponent;
};
