import {
	boundaryRegistry,
	getDestinationScreenKeyFromPairKey,
	pairs,
	type ScreenPairKey,
} from "../../../stores/bounds";
import type {
	ScreenInterpolationProps,
	TransitionInterpolatedStyle,
} from "../../../types/animation.types";
import { createBoundTag } from "./create-bound-tag";

/**
 * Matching boundaries fly to each other by default. For every complete link into this frame's
 * destination that the interpolator returned nothing for, adds the slot `bounds(id).styles()` gives:
 * transform, or size for a handoff (one live view, which a scale would stretch) unless the boundary
 * sets its own method. A key the interpolator returned, even `undefined`, means it handled that
 * boundary. A boundary with `animate={false}` on either screen is left alone.
 */
export const withDefaultBoundarySlots = (
	raw: TransitionInterpolatedStyle | undefined,
	scope: ScreenInterpolationProps,
): TransitionInterpolatedStyle | undefined => {
	"worklet";
	const destination = scope.next?.route.key ?? scope.current?.route.key;
	if (!destination) return raw;
	const all = pairs.get();
	const entries = boundaryRegistry.get();
	let out = raw;
	for (const key in all) {
		const pairKey = key as ScreenPairKey;
		if (getDestinationScreenKeyFromPairKey(pairKey) !== destination) continue;
		const links = all[pairKey]?.links;
		if (!links) continue;
		for (const id in links) {
			const link = links[id];
			if (!link?.source || !link.destination) continue;
			if (out && id in out) continue;
			const tag = createBoundTag({ id, group: link.group });
			if (!tag) continue;
			const screens = entries[tag]?.screens;
			if (
				screens?.[link.source.screenKey]?.still ||
				screens?.[link.destination.screenKey]?.still
			) {
				continue;
			}
			const ownMethod =
				screens?.[scope.current.route.key]?.boundaryConfig?.method;
			const style = scope
				.bounds({ id, group: link.group })
				.styles(
					link.destination.handoff && !ownMethod
						? { method: "size" }
						: undefined,
				);
			if (out === raw) out = { ...raw };
			(out as Record<string, unknown>)[id] = { style };
		}
	}
	return out;
};
