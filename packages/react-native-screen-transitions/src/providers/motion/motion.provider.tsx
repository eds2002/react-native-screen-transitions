import { type ReactNode, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useBuilderStore } from "../builder";
import { useMotionAnimationPipeline } from "./animation/pipeline";
import { useScreenGestures } from "./gestures/use-screen-gestures";
import { useRegisterScreenProgress } from "./helpers/progress-registry";
import { useMaybeBlockVisibility } from "./hooks/use-maybe-block-visibility";
import { useMotionValues } from "./hooks/use-motion-values";
import {
	MotionStoreProvider,
	ReusedMotionProvider,
	useOptionalMotionStore,
} from "./motion.store";
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

const ComposedMotion = ({
	onDismissRequest,
	children,
	values: externalValues,
}: MotionProviderProps) => {
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
	useRegisterScreenProgress(screenKey, state.visualProgress, state.closing);

	const { animatedStyle, animatedProps, isScreenReady } =
		useMaybeBlockVisibility({ motion: values, ancestorIsScreenReady });

	const value = useMemo(
		() => ({ options, gestures, state, isScreenReady }),
		[options, gestures, state, isScreenReady],
	);

	return (
		<MotionStoreProvider storeKey={screenKey} value={value}>
			<Animated.View
				style={[styles.container, animatedStyle]}
				animatedProps={animatedProps}
			>
				{children}
			</Animated.View>
		</MotionStoreProvider>
	);
};

/**
 * Gives the screen it is rendered in its motion; with `screenKey`, provides that screen's existing
 * motion instead.
 */
export const MotionProvider = (
	props: MotionProviderProps | { screenKey: string; children: ReactNode },
) =>
	"screenKey" in props ? (
		<ReusedMotionProvider screenKey={props.screenKey}>
			{props.children}
		</ReusedMotionProvider>
	) : (
		<ComposedMotion {...props} />
	);

const styles = StyleSheet.create({ container: { flex: 1 } });
