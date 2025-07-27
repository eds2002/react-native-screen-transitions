import type { ParamListBase } from "@react-navigation/native";
import { useMemo } from "react";
import { View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import { useScreenKeys } from "@/navigator/contexts/screen-keys";
import {
	GestureContext,
	type GestureContextType,
	type ScrollProgress,
} from "../contexts/gesture";
import { useBuildRootGestures } from "../hooks/gestures/use-build-root-gestures";
import type { AwareNavigationProp } from "../types";

type RootGestureHandlerProviderProps = {
	children: React.ReactNode;
	navigation: AwareNavigationProp<ParamListBase, string, undefined>;
};

export const RootGestureHandlerProvider = ({
	children,
	navigation,
}: RootGestureHandlerProviderProps) => {
	const { currentScreenKey } = useScreenKeys();
	const scrollProgress = useSharedValue<ScrollProgress>({
		x: 0,
		y: 0,
		contentHeight: 0,
		contentWidth: 0,
		layoutHeight: 0,
		layoutWidth: 0,
	});
	const { panGesture, nativeGesture } = useBuildRootGestures({
		scrollProgress,
		currentScreenKey,
		navigation,
	});
	const value = useMemo(() => {
		return {
			panGesture,
			scrollProgress,
			nativeGesture,
		};
	}, [panGesture, scrollProgress, nativeGesture]) satisfies GestureContextType;

	return (
		<GestureContext.Provider value={value}>
			<GestureDetector gesture={panGesture}>
				<View style={{ flex: 1 }}>{children}</View>
			</GestureDetector>
		</GestureContext.Provider>
	);
};
