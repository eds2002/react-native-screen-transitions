import { useLayoutEffect } from "react";
import { runOnUI } from "react-native-reanimated";
import {
	removeEntry,
	setEntry,
} from "../../../stores/bounds/internals/entries";
import type { BoundaryConfigProps } from "../types";

export const useBoundaryPresence = (params: {
	enabled: boolean;
	sharedBoundTag: string;
	currentScreenKey: string;
	boundaryConfig?: BoundaryConfigProps;
}) => {
	const { enabled, sharedBoundTag, currentScreenKey, boundaryConfig } = params;

	useLayoutEffect(() => {
		if (!enabled) return;

		runOnUI(setEntry)(sharedBoundTag, currentScreenKey, {
			boundaryConfig,
		});

		return () => {
			runOnUI(removeEntry)(sharedBoundTag, currentScreenKey);
		};
	}, [enabled, sharedBoundTag, currentScreenKey, boundaryConfig]);
};
