import type {
	Gesture,
	GestureStateChangeEvent,
	GestureUpdateEvent,
	PanGestureHandlerEventPayload,
	PinchGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import type { GestureStoreMap } from "../../../stores/gesture.store";
import type { SystemStoreMap } from "../../../stores/system.store";
import type {
	AnimationConfig,
	TransitionSpec,
} from "../../../types/animation.types";
import type {
	GestureActivationArea,
	GestureDirections,
	SnapPanDirectionConfig,
	SnapPinchDirectionConfig,
} from "../../../types/gesture.types";
import type {
	ClaimedDirections,
	DirectionOwnership,
} from "../../../types/ownership.types";
import type { ScreenTransitionConfig } from "../../../types/screen.types";
import type { ScreenOptionsContextValue } from "../options";
import type { EffectiveSnapPointsResult } from "./helpers/validate-snap-points";

export type PanGesture = ReturnType<typeof Gesture.Pan>;
export type PinchGesture = ReturnType<typeof Gesture.Pinch>;
export type ComposedGesture = ReturnType<typeof Gesture.Race>;

export type PanGestureEvent =
	| GestureUpdateEvent<PanGestureHandlerEventPayload>
	| GestureStateChangeEvent<PanGestureHandlerEventPayload>;

export type PinchGestureEvent =
	| GestureUpdateEvent<PinchGestureHandlerEventPayload>
	| GestureStateChangeEvent<PinchGestureHandlerEventPayload>;

export type ScrollGestureAxis = "vertical" | "horizontal";

export type ScrollGestureAxisState = {
	offset: number;
	contentSize: number;
	layoutSize: number;
};

export type ScrollGestureState = {
	vertical: ScrollGestureAxisState;
	horizontal: ScrollGestureAxisState;
	isTouched: boolean;
};

export type DirectionClaim = {
	routeKey: string;
	isDismissing: SharedValue<number>;
} | null;

export type DirectionClaimMap = {
	vertical: DirectionClaim;
	"vertical-inverted": DirectionClaim;
	horizontal: DirectionClaim;
	"horizontal-inverted": DirectionClaim;
};

export const NO_CLAIMS: DirectionClaimMap = {
	vertical: null,
	"vertical-inverted": null,
	horizontal: null,
	"horizontal-inverted": null,
};

export interface GestureContextType {
	detectorGesture: ComposedGesture;
	panGesture: PanGesture;
	pinchGesture: PinchGesture;
	scrollState: SharedValue<ScrollGestureState | null>;
	gestureContext: GestureContextType | null;
	claimedDirections: ClaimedDirections;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
}

export interface ScreenGestureParticipation {
	/** Whether this route is the first route in its stack. First routes never track gestures. */
	isFirstKey: boolean;
	/** Whether this route can dismiss to progress 0 from a gesture release. */
	canDismiss: boolean;
	/** Whether recognizers can activate to expose gesture values to interpolators. */
	canTrackGesture: boolean;
	effectiveSnapPoints: EffectiveSnapPointsResult;
	claimedDirections: ClaimedDirections;
	ownershipStatus: DirectionOwnership;
}

export interface ScreenGestureConfig {
	participation: ScreenGestureParticipation;
	pan: PanGesturePolicy;
	pinch: PinchGesturePolicy;
}

export interface PanGesturePolicy {
	enabled: boolean;
	gestureDirection: NonNullable<ScreenTransitionConfig["gestureDirection"]>;
	panActivationDirections: GestureDirections;
	snapAxisDirections: SnapPanDirectionConfig;
	gestureDrivesProgress: boolean;
	gestureSensitivity: NonNullable<ScreenTransitionConfig["gestureSensitivity"]>;
	gestureVelocityImpact: number;
	gestureSnapVelocityImpact: number;
	gestureReleaseVelocityScale: number;
	/** @deprecated v3 compatibility only. Removed in the next gesture runtime. */
	gestureReleaseVelocityMax: number;
	gestureActivationArea: GestureActivationArea;
	gestureSnapLocked: boolean;
	sheetScrollGestureBehavior: NonNullable<
		ScreenTransitionConfig["sheetScrollGestureBehavior"]
	>;
	gestureResponseDistance: ScreenTransitionConfig["gestureResponseDistance"];
	transitionSpec: TransitionSpec | undefined;
}

export interface PinchGesturePolicy {
	enabled: boolean;
	gestureDirection: NonNullable<ScreenTransitionConfig["gestureDirection"]>;
	snapDirections: SnapPinchDirectionConfig;
	pinchInEnabled: boolean;
	pinchOutEnabled: boolean;
	gestureDrivesProgress: boolean;
	gestureSensitivity: NonNullable<ScreenTransitionConfig["gestureSensitivity"]>;
	gestureSnapVelocityImpact: number;
	gestureSnapLocked: boolean;
	gestureReleaseVelocityScale: number;
	/** @deprecated v3 compatibility only. Removed in the next gesture runtime. */
	gestureReleaseVelocityMax: number;
	transitionSpec: TransitionSpec | undefined;
}

export interface GestureRuntimeStores {
	gestures: GestureStoreMap;
	animations: AnimationStoreMap;
	system: SystemStoreMap;
}

export interface PanGestureRuntime {
	participation: ScreenGestureParticipation;
	policy: PanGesturePolicy;
	stores: GestureRuntimeStores;
	screenOptions: ScreenOptionsContextValue;
	gestureProgressBaseline: SharedValue<number>;
	lockedSnapPoint: SharedValue<number>;
}

export interface PinchGestureRuntime {
	participation: ScreenGestureParticipation;
	policy: PinchGesturePolicy;
	stores: GestureRuntimeStores;
	screenOptions: ScreenOptionsContextValue;
	gestureProgressBaseline: SharedValue<number>;
	lockedSnapPoint: SharedValue<number>;
}

export interface GestureDimensions {
	width: number;
	height: number;
}

export interface PanTrackState {
	x: number;
	y: number;
	normX: number;
	normY: number;
}

export interface PinchTrackState {
	scale: number;
	normScale: number;
}

export interface PanReleaseResult {
	target: number;
	shouldDismiss: boolean;
	initialVelocity: number;
	transitionSpec: TransitionSpec | undefined;
	resetSpec: AnimationConfig | undefined;
}

export interface PinchReleaseResult {
	target: number;
	shouldDismiss: boolean;
	initialVelocity: number;
	transitionSpec: TransitionSpec | undefined;
	resetSpec: AnimationConfig | undefined;
}

export interface PanBehaviorStrategy {
	primeStart: (runtime: PanGestureRuntime) => void;
	resolveProgress: (
		runtime: PanGestureRuntime,
		dimensions: GestureDimensions,
		track: PanTrackState,
	) => number;
	resolveRelease: (
		event: PanGestureEvent,
		runtime: PanGestureRuntime,
		dimensions: GestureDimensions,
	) => PanReleaseResult;
}

export interface PinchBehaviorStrategy {
	primeStart: (runtime: PinchGestureRuntime) => void;
	resolveProgress: (
		runtime: PinchGestureRuntime,
		track: PinchTrackState,
	) => number;
	resolveRelease: (
		event: PinchGestureEvent,
		runtime: PinchGestureRuntime,
	) => PinchReleaseResult;
}

export interface PanBehavior {
	onStart: () => void;
	onUpdate: (event: PanGestureEvent) => void;
	onEnd: (event: PanGestureEvent) => void;
}

export interface PinchBehavior {
	onStart: (event: PinchGestureEvent) => void;
	onUpdate: (event: PinchGestureEvent) => void;
	onEnd: (event: PinchGestureEvent) => void;
}
