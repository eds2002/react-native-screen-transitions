import { createContext, useContext, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { GestureType } from "react-native-gesture-handler";
import { GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { useBuildGestures } from "../hooks/gestures/use-build-gestures";
import type { GestureStoreMap } from "../stores/gesture.store";
import { useKeys } from "./keys.provider";

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
	parentContext: GestureContextType | undefined;
}

type GestureProviderProps = {
	children: React.ReactNode;
};

const GestureContext = createContext<GestureContextType | undefined>(undefined);

/**
 * Provider that creates gesture handling for a screen.
 * If the current screen doesn't have gestures enabled but a parent does,
 * we pass through the parent's context so scrollable children can coordinate
 * with the ancestor's gestures.
 */
export const ScreenGestureProvider = ({ children }: GestureProviderProps) => {
	const parentContext = useContext(GestureContext);
	const { current } = useKeys();

	const hasOwnGestures = current.options.gestureEnabled === true;

	// If this screen doesn't have its own gestures but there's a parent context,
	// pass through the parent's gestures so scrollable children coordinate with
	// the ancestor that actually handles dismissal
	if (!hasOwnGestures && parentContext) {
		return children;
	}

	return (
		<ScreenGestureProviderInner parentContext={parentContext}>
			{children}
		</ScreenGestureProviderInner>
	);
};

const ScreenGestureProviderInner = ({
	children,
	parentContext,
}: GestureProviderProps & {
	parentContext: GestureContextType | undefined;
}) => {
	const scrollConfig = useSharedValue<ScrollConfig | null>(null);

	const { panGesture, nativeGesture, gestureAnimationValues } =
		useBuildGestures({
			scrollConfig,
			parentContext,
		});

	const value: GestureContextType = useMemo(
		() => ({
			panGesture,
			scrollConfig,
			nativeGesture,
			gestureAnimationValues,
			parentContext,
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
