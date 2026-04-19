import type { GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { GestureStoreMap } from "../../stores/gesture.store";
import type { ClaimedDirections } from "../../types/ownership.types";

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
	panGesture: GestureType;
	panGestureRef: React.MutableRefObject<GestureType | undefined>;
	scrollConfig: SharedValue<ScrollConfig | null>;
	gestureAnimationValues: GestureStoreMap;
	ancestorContext: GestureContextType | null;
	gestureEnabled: boolean;
	isIsolated: boolean;
	claimedDirections: ClaimedDirections;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
}
