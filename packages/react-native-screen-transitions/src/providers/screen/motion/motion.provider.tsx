import { type ReactNode, useMemo } from "react";
import createProvider from "../../../utils/create-provider";
import { useBuilderStore } from "../builder";
import { useMotionAnimationPipeline } from "./animation/pipeline";
import { useScreenGestures } from "./gestures/use-screen-gestures";
import { useMotionValues } from "./hooks/use-motion-values";
import { useScreenOptions } from "./options/use-screen-options";

export type MotionProviderProps = {
	children: ReactNode;
	onDismissRequest?: () => void;
};

export type MotionState = {
	options: ReturnType<typeof useScreenOptions>;
	gestures: ReturnType<typeof useScreenGestures>;
	state: ReturnType<typeof useMotionAnimationPipeline>;
};

export const {
	MotionProvider,
	getMotionStore,
	useMotionStore,
	useOptionalMotionStore,
} = createProvider("Motion", { global: true })<
	MotionProviderProps,
	MotionState
>(({ onDismissRequest }) => {
	const screenKey = useBuilderStore(
		(store) => store.derivations.currentScreenKey,
	);
	const values = useMotionValues();
	const options = useScreenOptions();

	const gestures = useScreenGestures(options, values, onDismissRequest);

	const state = useMotionAnimationPipeline(values);
	const value = useMemo(
		() => ({ options, gestures, state }),
		[options, gestures, state],
	);
	return { key: screenKey, value };
});
