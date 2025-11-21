import { createContext, useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { GestureType } from "react-native-gesture-handler";
import { GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { useBuildGestures } from "../hooks/gestures/use-build-gestures";
import type { GestureStoreMap } from "../stores/gesture-store";

export type ScrollConfig = {
	x: number;
	y: number;
	contentHeight: number;
	contentWidth: number;
	layoutHeight: number;
	layoutWidth: number;
};

export interface GestureContextType {
	panGesture: GestureType;
	nativeGesture: GestureType;
	scrollConfig: SharedValue<ScrollConfig | null>;
	gestureAnimationValues: GestureStoreMap;
	parentContext: GestureContextType | null;
}

type GestureProviderProps = {
	children: React.ReactNode;
};

const GestureContext = createContext<GestureContextType | undefined>(undefined);

export const ScreenGestureProvider = ({ children }: GestureProviderProps) => {
	const parentContext = useContext(GestureContext);

	const scrollConfig = useSharedValue<ScrollConfig | null>(null);

	const { panGesture, nativeGesture, gestureAnimationValues } =
		useBuildGestures({
			scrollConfig,
		});

	const value: GestureContextType = useMemo(
		() => ({
			panGesture,
			scrollConfig,
			nativeGesture,
			gestureAnimationValues,
			parentContext: parentContext || null,
		}),
		[
			panGesture,
			scrollConfig,
			nativeGesture,
			gestureAnimationValues,
			parentContext,
		],
	);

	return (
		<GestureContext.Provider value={value}>
			<GestureDetector gesture={panGesture}>
				<View style={styles.container}>{children}</View>
			</GestureDetector>
		</GestureContext.Provider>
	);
};

export const useGestureContext = () => {
	const context = useContext(GestureContext);

	if (!context) {
		throw new Error(
			"useGestureContext must be used within a ScreenGestureProvider",
		);
	}

	return context;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
