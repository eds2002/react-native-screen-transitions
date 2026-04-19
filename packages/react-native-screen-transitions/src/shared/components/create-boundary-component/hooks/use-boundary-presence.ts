import { useLayoutEffect } from "react";
import { runOnUI } from "react-native-reanimated";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryConfigProps } from "../types";

export const useBoundaryPresence = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	navigatorKey?: string;
	ancestorNavigatorKeys?: string[];
	boundaryConfig?: BoundaryConfigProps;
}) => {
	const {
		enabled,
		sharedBoundTag,
		currentScreenKey,
		ancestorKeys,
		navigatorKey,
		ancestorNavigatorKeys,
		boundaryConfig,
	} = params;
	const ancestorKeysSignature = ancestorKeys.join("|");
	const ancestorNavigatorKeysSignature = ancestorNavigatorKeys?.join("|");

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Depend on the ancestory keys signature>
	useLayoutEffect(() => {
		if (!enabled) return;

		runOnUI(BoundStore.registerBoundaryPresence)(
			sharedBoundTag,
			currentScreenKey,
			ancestorKeys,
			boundaryConfig,
			navigatorKey,
			ancestorNavigatorKeys,
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
		navigatorKey,
		ancestorNavigatorKeysSignature,
		boundaryConfig,
	]);
};
