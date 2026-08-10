import { useLayoutEffect } from "react";
import { runOnUI } from "react-native-reanimated";
import {
	registerBoundary,
	unregisterBoundary,
} from "../../../../stores/bounds/internals/coordinator";
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
	useLayoutEffect(() => {
		if (!enabled) return;

		runOnUI(registerBoundary)({
			boundTag,
			screenKey: currentScreenKey,
			entry: {
				boundaryConfig,
				handoff: handoff ? true : null,
				escapeClipping: escapeClipping ? true : null,
			},
		});

		return () => {
			runOnUI(unregisterBoundary)(boundTag, currentScreenKey);
		};
	}, [
		enabled,
		boundTag,
		currentScreenKey,
		boundaryConfig,
		handoff,
		escapeClipping,
	]);
};
