import { type MeasuredDimensions, makeMutable } from "react-native-reanimated";
import { cloneScrollMetadataState } from "../../../../stores/scroll.store";
import type { ScrollMetadataState } from "../../../../types/gesture.types";

export type PortalHostBounds = MeasuredDimensions & {
	scroll?: ScrollMetadataState | null;
};

type PortalHostBoundsState = Record<string, PortalHostBounds | null>;

const portalHostBounds = makeMutable<PortalHostBoundsState>({});

export const getPortalHostBounds = (hostKey: string) => {
	"worklet";
	return portalHostBounds.get()[hostKey] ?? null;
};

export const setPortalHostBounds = (
	hostKey: string,
	bounds: PortalHostBounds,
) => {
	"worklet";
	const nextBounds: PortalHostBounds = {
		...bounds,
		scroll: cloneScrollMetadataState(bounds.scroll),
	};

	portalHostBounds.set((state) => {
		"worklet";
		return {
			...state,
			[hostKey]: nextBounds,
		};
	});
};

export const clearPortalHostBounds = (hostKey: string) => {
	"worklet";
	portalHostBounds.set((state) => {
		"worklet";
		const nextState: PortalHostBoundsState = { ...state };
		delete nextState[hostKey];
		return nextState;
	});
};
