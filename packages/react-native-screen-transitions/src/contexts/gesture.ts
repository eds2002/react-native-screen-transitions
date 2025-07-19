import { createContext, useContext } from "react";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

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
	scrollProgress: SharedValue<ScrollProgress>;
	isPlaceholder?: boolean;
}

export const GestureContext = createContext<GestureContextType | undefined>(
	undefined,
);

export const useGestureContext = () => {
	const context = useContext(GestureContext);
	const scrollProgressFallback = useSharedValue<ScrollProgress>({
		x: 0,
		y: 0,
		contentHeight: 0,
		contentWidth: 0,
		layoutHeight: 0,
		layoutWidth: 0,
	});

	if (!context) {
		return {
			panGesture: Gesture.Pan(),
			nativeGesture: Gesture.Native(),
			scrollProgress: scrollProgressFallback,
			isPlaceholder: true,
		};
	}

	return context;
};
