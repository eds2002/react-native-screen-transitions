import { createContext, useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { GestureType } from "react-native-gesture-handler";
import {
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { useBuildGestures } from "../hooks/gestures/use-build-gestures";

export type ScrollProgress = {
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
	scrollProgress: SharedValue<ScrollProgress | null>;
	parentContext: GestureContextType | null;
}

type ScreenGestureProviderProps = {
	children: React.ReactNode;
};

export const DEFAULT_SCROLL_PROGRESS: ScrollProgress = {
	x: 0,
	y: 0,
	contentHeight: 0,
	contentWidth: 0,
	layoutHeight: 0,
	layoutWidth: 0,
};

const GestureContext = createContext<GestureContextType | undefined>(undefined);

export const ScreenGestureProvider = ({
	children,
}: ScreenGestureProviderProps) => {
	const parentContext = useContext(GestureContext);

	const scrollProgress = useSharedValue<ScrollProgress | null>(null);

	const { panGesture, nativeGesture } = useBuildGestures({
		scrollProgress,
	});

	const value: GestureContextType = useMemo(
		() => ({
			panGesture,
			scrollProgress,
			nativeGesture,
			parentContext: parentContext || null,
		}),
		[panGesture, scrollProgress, nativeGesture, parentContext],
	);

	return (
		<GestureHandlerRootView>
			<GestureContext.Provider value={value}>
				<GestureDetector gesture={panGesture}>
					<View style={styles.container}>{children}</View>
				</GestureDetector>
			</GestureContext.Provider>
		</GestureHandlerRootView>
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
