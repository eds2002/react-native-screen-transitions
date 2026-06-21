import { useLayoutEffect } from "react";
import { runOnUI } from "react-native-reanimated";
import {
	removeEntry,
	setEntry,
} from "../../../stores/bounds/internals/entries";
import type { BoundaryConfigProps } from "../types";

export const useBoundaryPresence = (params: {
	enabled: boolean;
	entryTag: string;
	currentScreenKey: string;
	boundaryConfig?: BoundaryConfigProps;
}) => {
	const { enabled, entryTag, currentScreenKey, boundaryConfig } = params;

	useLayoutEffect(() => {
		if (!enabled) return;

		runOnUI(setEntry)(entryTag, currentScreenKey, {
			boundaryConfig,
		});

		return () => {
			runOnUI(removeEntry)(entryTag, currentScreenKey);
		};
	}, [enabled, entryTag, currentScreenKey, boundaryConfig]);
};
