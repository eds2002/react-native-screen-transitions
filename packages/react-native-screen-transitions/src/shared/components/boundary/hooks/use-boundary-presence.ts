import { useLayoutEffect } from "react";
import { runOnUI } from "react-native-reanimated";
import {
	removeEntry,
	setEntry,
} from "../../../stores/bounds/internals/entries";
import type { BoundsPortalHost, BoundTag } from "../../../stores/bounds/types";
import type { BoundaryConfigProps } from "../types";

export const useBoundaryPresence = (params: {
	enabled: boolean;
	boundTag: BoundTag;
	currentScreenKey: string;
	boundaryConfig?: BoundaryConfigProps;
	portalHost?: BoundsPortalHost;
}) => {
	const { enabled, boundTag, currentScreenKey, boundaryConfig, portalHost } =
		params;
	const { tag } = boundTag;

	useLayoutEffect(() => {
		if (!enabled) return;

		runOnUI(setEntry)(tag, currentScreenKey, {
			boundaryConfig,
			portalHost: portalHost ?? null,
		});

		return () => {
			runOnUI(removeEntry)(tag, currentScreenKey);
		};
	}, [enabled, tag, currentScreenKey, boundaryConfig, portalHost]);
};
