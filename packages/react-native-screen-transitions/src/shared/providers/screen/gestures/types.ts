import type {
	Gesture,
	GestureStateChangeEvent,
	GestureUpdateEvent,
	PanGestureHandlerEventPayload,
	PinchGestureHandlerEventPayload,
	RotationGestureHandlerEventPayload,
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
	GestureDirections,
	ResolvedGestureActivationArea,
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
	SnapPanDirectionConfig,
	SnapPinchDirectionConfig,
} from "../../../types/gesture.types";
import type {
	ClaimedDirections,
	DirectionOwnership,
} from "../../../types/ownership.types";
import type { ScreenTransitionConfig } from "../../../types/screen.types";
import type { EffectiveSnapPointsResult } from "./shared/snap-points";

export type PanGesture = ReturnType<typeof Gesture.Pan>;
export type PinchGesture = ReturnType<typeof Gesture.Pinch>;
export type RotationGesture = ReturnType<typeof Gesture.Rotation>;
export type ComposedGesture = ReturnType<typeof Gesture.Simultaneous>;

export type PanGestureEvent =
	| GestureUpdateEvent<PanGestureHandlerEventPayload>
	| GestureStateChangeEvent<PanGestureHandlerEventPayload>;

export type PinchGestureEvent =
	| GestureUpdateEvent<PinchGestureHandlerEventPayload>
	| GestureStateChangeEvent<PinchGestureHandlerEventPayload>;

export type RotationGestureEvent =
	| GestureUpdateEvent<RotationGestureHandlerEventPayload>
	| GestureStateChangeEvent<RotationGestureHandlerEventPayload>;

/** Gesture that owns navigation release for the current simultaneous composition. */
export type GestureCompositionOwner = "pan" | "pinch" | null;

export type {
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
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

export const NO_DIRECTION_CLAIMS: DirectionClaimMap = {
	vertical: null,
	"vertical-inverted": null,
	horizontal: null,
	"horizontal-inverted": null,
};

export interface GestureContextType {
	routeKey: string;
	detectorGesture: ComposedGesture;
	panGesture: PanGesture;
	pinchGesture: PinchGesture;
	rotationGesture: RotationGesture;
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
	gestureSensitivity: NonNullable<ScreenTransitionConfig["gestureSensitivity"]>;
	gestureVelocityImpact: number;
	gestureSnapVelocityImpact: number;
	gestureReleaseVelocityScale: number;
	gestureActivationArea: ResolvedGestureActivationArea;
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
	gestureSensitivity: NonNullable<ScreenTransitionConfig["gestureSensitivity"]>;
	gestureSnapVelocityImpact: number;
	gestureSnapLocked: boolean;
	gestureReleaseVelocityScale: number;
	transitionSpec: TransitionSpec | undefined;
}

export interface GestureRuntimeStores {
	gestures: GestureStoreMap;
	animations: AnimationStoreMap;
	system: SystemStoreMap;
}

export type GesturePolicy = PanGesturePolicy | PinchGesturePolicy;

export interface GestureRuntime<TPolicy extends GesturePolicy> {
	participation: ScreenGestureParticipation;
	policy: TPolicy;
	stores: GestureRuntimeStores;
}

export type PanGestureRuntime = GestureRuntime<PanGesturePolicy>;

export type PinchGestureRuntime = GestureRuntime<PinchGesturePolicy>;

export type RotationGestureRuntime = GestureRuntime<PinchGesturePolicy>;

export interface GestureDimensions {
	width: number;
	height: number;
}

export interface PanTrackState {
	x: number;
	y: number;
	normX: number;
	normY: number;
	velocity: number;
}

export interface PinchTrackState {
	scale: number;
	normScale: number;
}

export interface PanReleaseResult {
	target: number;
	shouldDismiss: boolean;
	initialVelocity: number;
	commitProgress?: number;
	transitionSpec: TransitionSpec | undefined;
	resetSpec: AnimationConfig | undefined;
}

export interface PanReleasePlan {
	target: number;
	shouldDismiss: boolean;
	progressVelocity: number;
	resetVelocityX: number;
	resetVelocityY: number;
	resetVelocityNormX: number;
	resetVelocityNormY: number;
	handoffVelocity: number;
	commitProgress?: number;
	transitionSpec: TransitionSpec | undefined;
	resetSpec: AnimationConfig | undefined;
}

export interface PinchReleaseResult {
	target: number;
	shouldDismiss: boolean;
	initialVelocity: number;
	handoffVelocity: number;
	commitProgress?: number;
	resetValuesImmediately?: boolean;
	transitionSpec: TransitionSpec | undefined;
	resetSpec: AnimationConfig | undefined;
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

export interface RotationBehavior {
	onStart: () => void;
	onUpdate: (event: RotationGestureEvent) => void;
}
