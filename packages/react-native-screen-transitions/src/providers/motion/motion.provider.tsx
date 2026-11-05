import { type ReactNode, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import createProvider from "../../utils/create-provider";
import { useBuilderStore } from "../builder";
import { useMotionAnimationPipeline } from "./animation/pipeline";
import { useScreenGestures } from "./gestures/use-screen-gestures";
import { useMaybeBlockVisibility } from "./hooks/use-maybe-block-visibility";
import { useMotionValues } from "./hooks/use-motion-values";
import { useScreenOptions } from "./options/use-screen-options";
import type { MotionValues } from "./types";

export type MotionProviderProps = {
	children: ReactNode;
	onDismissRequest?: () => void;
	/**
	 * @internal Values created outside the provider by `useMotion`, so its handle exposes the
	 * live values themselves. Must stay the same for the provider's lifetime.
	 */
	values?: MotionValues;
};

export type MotionState = {
	options: ReturnType<typeof useScreenOptions>;
	gestures: ReturnType<typeof useScreenGestures>;
	state: ReturnType<typeof useMotionAnimationPipeline>;
	/** False until this screen and its ancestors are ready, or after visual close. */
	isScreenReady: SharedValue<boolean>;
};

export const {
	MotionProvider,
	getMotionStore,
	useMotionStore,
	useOptionalMotionStore,
} = createProvider("Motion", { global: true })<
	MotionProviderProps,
	MotionState
>(({ onDismissRequest, children, values: externalValues }) => {
	const screenKey = useBuilderStore(
		(store) => store.derivations.currentScreenKey,
	);
	const ancestorIsScreenReady = useOptionalMotionStore(
		(store) => store?.isScreenReady ?? null,
	);
	const ownValues = useMotionValues();
	const values = externalValues ?? ownValues;
	const options = useScreenOptions();

	const gestures = useScreenGestures(options, values, onDismissRequest);

	const state = useMotionAnimationPipeline(values);

	const { animatedStyle, animatedProps, isScreenReady } =
		useMaybeBlockVisibility({ motion: values, ancestorIsScreenReady });

	const value = useMemo(
		() => ({ options, gestures, state, isScreenReady }),
		[options, gestures, state, isScreenReady],
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
