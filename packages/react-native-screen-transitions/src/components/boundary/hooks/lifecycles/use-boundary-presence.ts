import { useLayoutEffect } from "react";
import { scheduleOnUI } from "react-native-worklets";
import {
	removeEntry,
	setEntry,
} from "../../../../stores/bounds/internals/entries";
import type { BoundTag } from "../../../../stores/bounds/types";
import type { BoundaryConfigProps } from "../../types";

export const useBoundaryPresence = (params: {
	enabled: boolean;
	boundTag: BoundTag;
	currentScreenKey: string;
	boundaryConfig?: BoundaryConfigProps;
	handoff?: boolean;
	escapeClipping?: boolean;
}) => {
	const {
		enabled,
		boundTag,
		currentScreenKey,
		boundaryConfig,
		handoff,
		escapeClipping,
	} = params;
	const { tag } = boundTag;

	useLayoutEffect(() => {
		if (!enabled) return;

		scheduleOnUI(setEntry, tag, currentScreenKey, {
			boundaryConfig,
			handoff: handoff ? true : null,
			escapeClipping: escapeClipping ? true : null,
		});

		return () => {
			scheduleOnUI(removeEntry, tag, currentScreenKey);
		};
	}, [enabled, tag, currentScreenKey, boundaryConfig, handoff, escapeClipping]);
};
