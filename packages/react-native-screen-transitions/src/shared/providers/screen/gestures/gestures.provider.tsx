import { Fragment, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { ScrollStore } from "../../../stores/scroll.store";
import createProvider from "../../../utils/create-provider";
import { useDescriptorsStore } from "../descriptors";
import { useScreenGestureConfig } from "./hooks/use-screen-gesture-config";
import { GestureOwnershipBridge } from "./ownership/gesture-ownership-bridge";
import { useBuildPanGesture } from "./pan/use-build-pan-gesture";
import { useBuildPinchGesture } from "./pinch/use-build-pinch-gesture";
import {
	type DirectionClaimMap,
	type GestureCompositionOwner,
	type GestureContextType,
	NO_DIRECTION_CLAIMS,
} from "./types";

interface ScreenGestureProviderProps {
	children: React.ReactNode;
}

export const { ScreenGestureProvider, useScreenGestureStore: useGestureStore } =
	createProvider("ScreenGesture", { guarded: false })<
		ScreenGestureProviderProps,
		GestureContextType
	>(
		(
			{ children },
			{ useParentStore },
		): { value: GestureContextType; children: React.ReactNode } => {
			const currentScreenKey = useDescriptorsStore(
				(store) => store.derivations.currentScreenKey,
			);
			const isTopMostScreen = useDescriptorsStore(
				(store) => store.derivations.isTopMostScreen,
			);
			const gestureContext = useParentStore((parentContext) =>
				isTopMostScreen ? parentContext : null,
			);
			const gestureConfig = useScreenGestureConfig(gestureContext);

			const scrollState = ScrollStore.getValue(
				currentScreenKey,
				"coordination",
			);

			// Ancestors read this before activating. If a nested screen claims the same
			// direction, it writes here so the ancestor can fail and let it take priority.
			const childDirectionClaims =
				useSharedValue<DirectionClaimMap>(NO_DIRECTION_CLAIMS);

			// The first gesture to activate owns navigation release. Other gestures may
			// still join as companion trackers during the same simultaneous composition.
			const gestureCompositionOwner =
				useSharedValue<GestureCompositionOwner>(null);

			const panGesture = useBuildPanGesture({
				scrollState,
				gestureConfig,
				childDirectionClaims,
				gestureCompositionOwner,
			});

			const pinchGesture = useBuildPinchGesture({
				gestureConfig,
				gestureCompositionOwner,
			});

			const detectorGesture = useMemo(
				() => Gesture.Simultaneous(panGesture, pinchGesture),
				[panGesture, pinchGesture],
			);

			const value = useMemo<GestureContextType>(
				() => ({
					routeKey: currentScreenKey,
					detectorGesture,
					panGesture,
					pinchGesture,
					scrollState,
					gestureContext,
					claimedDirections: gestureConfig.participation.claimedDirections,
					childDirectionClaims,
				}),
				[
					currentScreenKey,
					detectorGesture,
					panGesture,
					pinchGesture,
					scrollState,
					gestureContext,
					gestureConfig.participation.claimedDirections,
					childDirectionClaims,
				],
			);

			const content = useMemo(
				() => (
					<Fragment>
						<GestureOwnershipBridge />
						{children}
					</Fragment>
				),
				[children],
			);

			return {
				value,
				children: content,
			};
		},
	);
