import { useLayoutEffect } from "react";
import { scheduleOnUI } from "react-native-worklets";
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

		scheduleOnUI(setEntry, entryTag, currentScreenKey, {
			boundaryConfig,
		});

		return () => {
			scheduleOnUI(removeEntry, entryTag, currentScreenKey);
		};
	}, [enabled, entryTag, currentScreenKey, boundaryConfig]);
};
