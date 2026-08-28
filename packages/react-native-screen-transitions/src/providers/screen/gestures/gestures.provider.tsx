import { useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { ScrollStore } from "../../../stores/scroll.store";
import createProvider from "../../../utils/create-provider";
import { useDescriptorsStore } from "../descriptors";
import { useScreenGestureConfig } from "./hooks/use-screen-gesture-config";
import { useRegisterGestureOwnership } from "./ownership/use-register-gesture-ownership";
import { useBuildPanGesture } from "./pan/use-build-pan-gesture";
import { useBuildPinchGesture } from "./pinch/use-build-pinch-gesture";
import {
	type GestureCompositionOwner,
	type GestureContextType,
	NO_GESTURE_OWNERS,
	type ScreenGestureSource,
} from "./types";

interface ScreenGestureProviderProps {
	children: React.ReactNode;
}

const createScreenGestureProvider = createProvider("ScreenGesture", {
	global: true,
})<ScreenGestureProviderProps, GestureContextType>;

export const {
	ScreenGestureProvider,
	useOptionalScreenGestureStore,
	useScreenGestureStore,
}: ReturnType<typeof createScreenGestureProvider> = createScreenGestureProvider(
	({ children }) => {
		const currentScreenKey = useDescriptorsStore(
			(store) => store.derivations.currentScreenKey,
		);
		const gestureConfig = useScreenGestureConfig();
		const scrollState = ScrollStore.getValue(currentScreenKey, "coordination");
		const gestureOwners = useSharedValue({ ...NO_GESTURE_OWNERS });
		const gestureCompositionOwner =
			useSharedValue<GestureCompositionOwner>(null);
		const panGesture = useBuildPanGesture({
			scrollState,
			gestureConfig,
			gestureOwners,
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
			}),
			[
				currentScreenKey,
				detectorGesture,
				panGesture,
				pinchGesture,
				scrollState,
			],
		);
		useRegisterGestureOwnership({
			claimedDirections: gestureConfig.participation.claimedDirections,
			owners: gestureOwners,
			source,
		});

		return {
			key: currentScreenKey,
			value: source,
			children,
		};
	},
);
