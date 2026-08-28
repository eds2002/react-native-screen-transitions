import type { ReactNode } from "react";
import createProvider from "../../../utils/create-provider";
import { useBlankStackStore } from "../../stack/blank-stack.provider";
import { useDescriptorsStore } from "../descriptors";
import { useScreenAnimationPipeline } from "./helpers/pipeline";

type Props = {
	children: ReactNode;
};

export type ScreenAnimationContextValue = ReturnType<
	typeof useScreenAnimationPipeline
>;

export const {
	StoreProvider: ScreenAnimationStoreProvider,
	ScreenAnimationProvider,
	useOptionalScreenAnimationStore,
	useScreenAnimationStore,
} = createProvider("ScreenAnimation", {
	global: true,
})<Props, ScreenAnimationContextValue>(() => {
	const currentScreenKey = useDescriptorsStore(
		(store) => store.derivations.currentScreenKey,
	);
	const isClosing = useBlankStackStore(
		(store) => store.scenesByKey[currentScreenKey]?.activity === "closing",
	);
	const pipeline = useScreenAnimationPipeline();

	return {
		key: currentScreenKey,
		unregisterOnCleanup: isClosing,
		value: pipeline,
	};
});
