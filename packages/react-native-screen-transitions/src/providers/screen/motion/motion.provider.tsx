import { type ReactNode, useMemo } from "react";
import createProvider from "../../../utils/create-provider";
import { useBuilderStore } from "../builder";
import { useMotionAnimationPipeline } from "./animation/pipeline";
import { useScreenGestures } from "./gestures/use-screen-gestures";
import { useScreenOptions } from "./options/use-screen-options";

export type MotionProviderProps = {
	children: ReactNode;
	onDismissRequest?: () => void;
};

export type MotionState = {
	options: ReturnType<typeof useScreenOptions>;
	gestures: ReturnType<typeof useScreenGestures>;
	animations: ReturnType<typeof useMotionAnimationPipeline>;
};

export const {
	MotionProvider,
	StoreProvider: MotionStoreProvider,
	useMotionStore,
	useOptionalMotionStore,
} = createProvider("Motion", { global: true })<
	MotionProviderProps,
	MotionState
>(({ onDismissRequest }) => {
	const screenKey = useBuilderStore(
		(store) => store.derivations.currentScreenKey,
	);
	const options = useScreenOptions();
	const gestures = useScreenGestures(options, onDismissRequest);
	const animations = useMotionAnimationPipeline();
	const value = useMemo(
		() => ({ options, gestures, animations }),
		[options, gestures, animations],
	);
	return { key: screenKey, value };
});
