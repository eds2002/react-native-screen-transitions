import type {
	ComposedGesture,
	PanGesture,
	PinchGesture,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { AnimationStoreMap } from "../../stores/animation.store";
import type { GestureStoreMap } from "../../stores/gesture.store";
import type { SystemStoreMap } from "../../stores/system.store";
import type { TransitionSpec } from "../../types/animation.types";
import type {
	GestureActivationArea,
	GestureDirections,
} from "../../types/gesture.types";
import type {
	ClaimedDirections,
	DirectionOwnership,
} from "../../types/ownership.types";
import type { ScreenTransitionConfig } from "../../types/screen.types";
import type { EffectiveSnapPointsResult } from "../../utils/gesture/validate-snap-points";

export type ScrollConfig = {
	x: number;
	y: number;
	contentHeight: number;
	contentWidth: number;
	layoutHeight: number;
	layoutWidth: number;
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
	detectorGesture: PanGesture | ComposedGesture;
	panGesture: PanGesture;
	pinchGesture?: PinchGesture;
	scrollConfig: SharedValue<ScrollConfig | null>;
	gestureContext: GestureContextType | null;
	gestureEnabled: boolean;
	claimedDirections: ClaimedDirections;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
}

export interface ScreenGestureBundle {
	detectorGesture: PanGesture | ComposedGesture;
	panGesture: PanGesture;
	pinchGesture?: PinchGesture;
}

export interface ScreenGestureConfig {
	routeKey: string;
	canDismiss: boolean;
	gestureEnabled: boolean;
	effectiveSnapPoints: EffectiveSnapPointsResult;
	claimedDirections: ClaimedDirections;
	ownershipStatus: DirectionOwnership;
}

export interface PanGesturePolicy {
	enabled: boolean;
	gestureDirection: ScreenTransitionConfig["gestureDirection"];
	directions: GestureDirections;
	snapAxis: "horizontal" | "vertical";
	gestureDrivesProgress: boolean;
	gestureSensitivity: number;
	gestureVelocityImpact: number;
	gestureSnapVelocityImpact: number;
	gestureReleaseVelocityScale: number;
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
	gestureDirection: ScreenTransitionConfig["gestureDirection"];
	pinchInEnabled: boolean;
	pinchOutEnabled: boolean;
	gestureDrivesProgress: boolean;
	gestureSensitivity: number;
	gestureVelocityImpact: number;
	gestureSnapVelocityImpact: number;
	gestureSnapLocked: boolean;
	gestureReleaseVelocityScale: number;
	transitionSpec: TransitionSpec | undefined;
}

export interface PanGestureSharedValues {
	gestureStartProgress: SharedValue<number>;
	lockedSnapPoint: SharedValue<number>;
}

export interface PanGestureRuntime {
	config: ScreenGestureConfig;
	policy: PanGesturePolicy;
	gestureStartProgress: SharedValue<number>;
	lockedSnapPoint: SharedValue<number>;
}

export interface PinchGestureRuntime {
	config: ScreenGestureConfig;
	policy: PinchGesturePolicy;
	gestureStartProgress: SharedValue<number>;
	lockedSnapPoint: SharedValue<number>;
}
