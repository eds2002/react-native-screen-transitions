import { Fragment, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { ScrollStore } from "../../../stores/scroll.store";
import createProvider from "../../../utils/create-provider";
import { useDescriptorsStore } from "../descriptors";
import { useCurrentScreenRelationships } from "../use-current-screen-relationships";
import { useScreenGestureConfig } from "./hooks/use-screen-gesture-config";
import { GestureOwnershipBridge } from "./ownership/gesture-ownership-bridge";
import { useBuildPanGesture } from "./pan/use-build-pan-gesture";
import { useBuildPinchGesture } from "./pinch/use-build-pinch-gesture";
import {
	type DirectionClaimMap,
	type GestureCompositionOwner,
	type GestureContextType,
	NO_DIRECTION_CLAIMS,
	type ScreenGestureSource,
} from "./types";

interface ScreenGestureProviderProps {
	children: React.ReactNode;
}

type ScreenGestureStoreValue = GestureContextType & {
	relationshipGestureSources: readonly ScreenGestureSource[];
};

const EMPTY_GESTURE_SOURCES: readonly ScreenGestureSource[] = [];

const createScreenGestureProvider = createProvider("ScreenGesture", {
	global: true,
})<ScreenGestureProviderProps, ScreenGestureStoreValue>;

export const {
	ScreenGestureProvider,
	useOptionalScreenGestureStore,
	useScreenGestureStore,
}: ReturnType<typeof createScreenGestureProvider> = createScreenGestureProvider(
	({ children }) => {
		const currentScreenKey = useDescriptorsStore(
			(store) => store.derivations.currentScreenKey,
		);
		const isTopMostScreen = useDescriptorsStore(
			(store) => store.derivations.isTopMostScreen,
		);
		const relationships = useCurrentScreenRelationships();
		const relationshipAncestorGestures =
			useOptionalScreenGestureStore(
				relationships.parentScreenKey,
				(store) => store.relationshipGestureSources,
			) ?? EMPTY_GESTURE_SOURCES;
		const ancestorGestures = isTopMostScreen
			? relationshipAncestorGestures
			: EMPTY_GESTURE_SOURCES;
		const gestureConfig = useScreenGestureConfig(ancestorGestures);
		const scrollState = ScrollStore.getValue(currentScreenKey, "coordination");
		const childDirectionClaims =
			useSharedValue<DirectionClaimMap>(NO_DIRECTION_CLAIMS);
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
		const source = useMemo<ScreenGestureSource>(
			() => ({
				routeKey: currentScreenKey,
				detectorGesture,
				panGesture,
				pinchGesture,
				scrollState,
				claimedDirections: gestureConfig.participation.claimedDirections,
				childDirectionClaims,
			}),
			[
				currentScreenKey,
				detectorGesture,
				panGesture,
				pinchGesture,
				scrollState,
				gestureConfig.participation.claimedDirections,
				childDirectionClaims,
			],
		);
		const relationshipGestureSources = useMemo(
			() => [source, ...ancestorGestures],
			[source, ancestorGestures],
		);
		const value = useMemo<ScreenGestureStoreValue>(
			() => ({
				...source,
				ancestorGestures,
				relationshipGestureSources,
			}),
			[source, ancestorGestures, relationshipGestureSources],
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
			key: currentScreenKey,
			value,
			children: content,
		};
	},
);
