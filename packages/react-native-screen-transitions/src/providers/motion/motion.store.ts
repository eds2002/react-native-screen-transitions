import type { ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";
import createProvider from "../../utils/create-provider";
import type { useMotionAnimationPipeline } from "./animation/pipeline";
import type { useScreenGestures } from "./gestures/use-screen-gestures";
import type { useScreenOptions } from "./options/use-screen-options";

export type MotionState = {
	options: ReturnType<typeof useScreenOptions>;
	gestures: ReturnType<typeof useScreenGestures>;
	state: ReturnType<typeof useMotionAnimationPipeline>;
	/** False until this screen and its ancestors are ready, or after visual close. */
	isScreenReady: SharedValue<boolean>;
};

/**
 * A screen's motion: options, gestures, animation state and readiness. The value is composed by
 * MotionProvider (motion.provider.tsx); the hooks that read it (an ancestor's, from inside a nested
 * screen's gestures) import only this module, so reading it never imports what composes it.
 */
export const {
	StoreProvider: MotionStoreProvider,
	MotionProvider: ReusedMotionProvider,
	getMotionStore,
	useMotionStore,
	useOptionalMotionStore,
} = createProvider("Motion", { global: true })<
	{ storeKey: string; value: MotionState; children: ReactNode },
	MotionState
>(({ storeKey, value, children }) => ({ key: storeKey, value, children }));
