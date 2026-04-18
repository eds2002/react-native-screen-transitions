import { useLayoutEffect } from "react";
import { runOnUISync } from "react-native-worklets";
import { BoundStore } from "../../../stores/bounds";
import type { BoundaryConfigProps } from "../types";

interface UseBoundaryPresenceParams {
	enabled: boolean;
	sharedBoundTag: string;
	currentScreenKey: string;
	ancestorKeys: string[];
	navigatorKey?: string;
	ancestorNavigatorKeys?: string[];
	boundaryConfig?: BoundaryConfigProps;
}

export const useBoundaryPresence = ({
	enabled,
	sharedBoundTag,
	currentScreenKey,
	ancestorKeys,
	navigatorKey,
	ancestorNavigatorKeys,
	boundaryConfig,
}: UseBoundaryPresenceParams) => {
	const ancestorKeysSignature = ancestorKeys.join("|");
	const ancestorNavigatorKeysSignature = ancestorNavigatorKeys?.join("|");

	// biome-ignore lint/correctness/useExhaustiveDependencies: <Depend on the ancestory keys signature>
	useLayoutEffect(() => {
		if (!enabled) return;

		runOnUISync(BoundStore.entry.set, sharedBoundTag, currentScreenKey, {
			ancestorKeys,
			boundaryConfig,
			navigatorKey,
			ancestorNavigatorKeys,
		});

		return () => {
			runOnUISync(BoundStore.entry.remove, sharedBoundTag, currentScreenKey);
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
