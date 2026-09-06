import { type ReactNode, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import createProvider from "../../../utils/create-provider";
import { useBuilderStore } from "../builder";
import { useMotionAnimationPipeline } from "./animation/pipeline";
import { useScreenGestures } from "./gestures/use-screen-gestures";
import { useMaybeBlockVisibility } from "./hooks/use-maybe-block-visibility";
import { useMotionValues } from "./hooks/use-motion-values";
import { useScreenReady } from "./hooks/use-screen-ready";
import { useScreenOptions } from "./options/use-screen-options";

export type MotionProviderProps = {
	children: ReactNode;
	onDismissRequest?: () => void;
};

export type MotionState = {
	options: ReturnType<typeof useScreenOptions>;
	gestures: ReturnType<typeof useScreenGestures>;
	state: ReturnType<typeof useMotionAnimationPipeline>;
	screenReady: SharedValue<number>;
	visibilityBlocked: SharedValue<boolean>;
};

export const {
	MotionProvider,
	getMotionStore,
	useMotionStore,
	useOptionalMotionStore,
} = createProvider("Motion", { global: true })<
	MotionProviderProps,
	MotionState
>(({ onDismissRequest, children }) => {
	const screenKey = useBuilderStore(
		(store) => store.derivations.currentScreenKey,
	);
	const ancestorVisibilityBlocked = useOptionalMotionStore(
		(store) => store?.visibilityBlocked ?? null,
	);
	const values = useMotionValues();
	const options = useScreenOptions();

	const gestures = useScreenGestures(options, values, onDismissRequest);

	const state = useMotionAnimationPipeline(values);
	const screenReady = useScreenReady(values);

	const { animatedStyle, animatedProps, visibilityBlocked } =
		useMaybeBlockVisibility({ motion: values, ancestorVisibilityBlocked });

	const value = useMemo(
		() => ({ options, gestures, state, screenReady, visibilityBlocked }),
		[options, gestures, state, screenReady, visibilityBlocked],
	);

	return {
		key: screenKey,
		value,
		children: (
			<Animated.View
				style={[styles.container, animatedStyle]}
				animatedProps={animatedProps}
			>
				{children}
			</Animated.View>
		),
	};
});

const styles = StyleSheet.create({ container: { flex: 1 } });
