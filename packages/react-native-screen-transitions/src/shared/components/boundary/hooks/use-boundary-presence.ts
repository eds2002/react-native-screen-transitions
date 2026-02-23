import { useEffect } from "react";
import { runOnUI } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryConfigProps } from "../types";

export const useBoundaryPresence = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	boundaryConfig?: BoundaryConfigProps;
}) => {
	const {
		enabled,
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		boundaryConfig,
	} = params;
	const ancestorKeysSignature = ancestorKeys.join("|");

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Depend on the ancestory keys signature>
	useEffect(() => {
		if (!enabled) return;

		runOnUI(BoundStore.registerBoundaryPresence)(
			sharedBoundTag,
			currentScreenKey,
			ancestorKeys,
			boundaryConfig,
		);

		return () => {
			runOnUI(BoundStore.unregisterBoundaryPresence)(
				sharedBoundTag,
				currentScreenKey,
			);
		};
	}, [
		enabled,
		sharedBoundTag,
		currentScreenKey,
		ancestorKeysSignature,
		boundaryConfig,
	]);
};
