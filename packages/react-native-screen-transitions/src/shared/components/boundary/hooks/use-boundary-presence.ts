import { useLayoutEffect } from "react";
import { runOnUI } from "react-native-reanimated";
import {
	removeEntry,
	setEntry,
} from "../../../stores/bounds/internals/entries";
import type {
	BoundsPortalHostPreference,
	BoundTag,
} from "../../../stores/bounds/types";
import { resolvePortalHost } from "../portal/utils/resolve-portal";
import type { BoundaryConfigProps, BoundaryPortal } from "../types";

export const useBoundaryPresence = (params: {
	enabled: boolean;
	boundTag: BoundTag;
	currentScreenKey: string;
	boundaryConfig?: BoundaryConfigProps;
	portal?: BoundaryPortal;
	portalHostPreference?: BoundsPortalHostPreference;
}) => {
	const {
		enabled,
		boundTag,
		currentScreenKey,
		boundaryConfig,
		portal,
		portalHostPreference,
	} = params;
	const { tag } = boundTag;
	const portalAttachTarget = resolvePortalHost(portal);

	useLayoutEffect(() => {
		if (!enabled) return;

		runOnUI(setEntry)(tag, currentScreenKey, {
			boundaryConfig,
			portalAttachTarget: portalAttachTarget ?? null,
			portalHostPreference: portalHostPreference ?? null,
		});

		return () => {
			runOnUI(removeEntry)(tag, currentScreenKey);
		};
	}, [
		enabled,
		tag,
		currentScreenKey,
		boundaryConfig,
		portalAttachTarget,
		portalHostPreference,
	]);
};
