import type { GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { useBuildGestures } from "../hooks/gestures/use-build-gestures";
import type { GestureStoreMap } from "../stores/gesture.store";
import { StackType } from "../types/stack.types";
import createProvider from "../utils/create-provider";
import { useKeys } from "./screen/keys.provider";
import { useStackCoreContext } from "./stack/core.provider";

export type ScrollConfig = {
	x: number;
	y: number;
	contentHeight: number;
	contentWidth: number;
	layoutHeight: number;
	layoutWidth: number;
	isTouched: boolean;
};

export interface GestureContextType {
	panGesture: GestureType;
	panGestureRef: React.MutableRefObject<GestureType | undefined>;
	nativeGesture: GestureType;
	scrollConfig: SharedValue<ScrollConfig | null>;
	gestureAnimationValues: GestureStoreMap;
	ancestorContext: GestureContextType | null;
	gestureEnabled: boolean;
	isIsolated: boolean;
}

interface ScreenGestureProviderProps {
	children: React.ReactNode;
}

export const {
	ScreenGestureProvider,
	useScreenGestureContext: useGestureContext,
} = createProvider("ScreenGesture", { guarded: false })<
	ScreenGestureProviderProps,
	GestureContextType
>(({ children }) => {
	const { current } = useKeys();
	const { flags } = useStackCoreContext();
	const ancestorContext = useGestureContext();
	const scrollConfig = useSharedValue<ScrollConfig | null>(null);

	const hasGestures = current.options.gestureEnabled === true;
	const isIsolated = flags.STACK_TYPE === StackType.COMPONENT;

	const { panGesture, panGestureRef, nativeGesture, gestureAnimationValues } =
		useBuildGestures({
			scrollConfig,
			ancestorContext,
		});

	const value: GestureContextType = {
		panGesture,
		panGestureRef,
		scrollConfig,
		nativeGesture,
		gestureAnimationValues,
		ancestorContext,
		gestureEnabled: hasGestures,
		isIsolated,
	};

	return {
		value,
		children,
	};
});
