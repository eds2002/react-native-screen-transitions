import { useLayoutEffect } from "react";
import { runOnUI } from "react-native-reanimated";
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

		runOnUI(setEntry)(tag, currentScreenKey, {
			boundaryConfig,
			handoff: handoff ? true : null,
			escapeClipping: escapeClipping ? true : null,
		});

		return () => {
			runOnUI(removeEntry)(tag, currentScreenKey);
		};
	}, [enabled, tag, currentScreenKey, boundaryConfig, handoff, escapeClipping]);
};
