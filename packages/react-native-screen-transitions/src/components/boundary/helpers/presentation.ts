import type { DerivedValue } from "react-native-reanimated";
import { getLinkKeyFromTag } from "../../../stores/bounds/helpers/link-pairs.helpers";
import type {
	boundaryRegistry,
	pairs,
} from "../../../stores/bounds/internals/state";
import type { BoundaryHandoffTarget } from "../../../types/animation.types";

export type { BoundaryPairPresentation } from "../../../providers/orchestrator/helpers/use-pair-presentation";

import type { BoundaryPairPresentation } from "../../../providers/orchestrator/helpers/use-pair-presentation";

export type BoundaryPresentationState = {
	presentations: readonly (
		| DerivedValue<BoundaryPairPresentation | undefined>
		| null
		| undefined
	)[];
	pairs: ReturnType<typeof pairs.get>;
	entries: ReturnType<typeof boundaryRegistry.get>;
	/**
	 * The screen this boundary's own screen is transitioning with (its frame's next screen), if any.
	 * A source follows that pair, as its inline style does: when a new pair opens while an earlier one
	 * from the same card is still closing, the card keeps following the closing one until its screen
	 * moves on, instead of jumping to the new pair's start.
	 */
	following?: string;
	/** Each screen's own next route, for receivers further along a handoff chain. */
	nextByScreen?: Record<string, string | undefined>;
};

export function resolveBoundaryPresentation(
	screenKey: string,
	boundaryId: string,
	state: BoundaryPresentationState,
) {
	"worklet";
	const linkKey = getLinkKeyFromTag(boundaryId);
	let result: BoundaryPairPresentation | undefined;
	let other: BoundaryPairPresentation | undefined;
	for (const value of state.presentations) {
		const presentation = value?.get();
		if (!presentation) continue;
		const pair = state.pairs[presentation.pairKey];
		const link = pair?.links[linkKey];
		if (!link || (link.group && pair.groups[link.group]?.activeId !== linkKey))
			continue;
		const sourceKey = link.source?.screenKey ?? presentation.sourceKey;
		const destinationKey =
			link.destination?.screenKey ?? presentation.destinationKey;
		if (sourceKey !== screenKey && destinationKey !== screenKey) continue;
		const candidate = { ...presentation, sourceKey, destinationKey };
		const followed =
			destinationKey === screenKey ||
			!state.following ||
			destinationKey === state.following;
		// A preparing or completed pair cannot displace a live presentation.
		if (followed) {
			if (result && !presentation.ready) continue;
			result = candidate;
		} else {
			if (other && !presentation.ready) continue;
			other = candidate;
		}
	}
	return result ?? other;
}

export function resolveBoundaryReceiver(
	presentation: BoundaryPairPresentation | undefined,
	target: BoundaryHandoffTarget | undefined,
	screenKey: string,
) {
	"worklet";
	if (!presentation) return screenKey;
	return presentation.ready && target !== "source"
		? presentation.destinationKey
		: presentation.sourceKey;
}

/**
 * A receiver whose pair is closing while a newer screen was pushed from it (spam: push, pop, push):
 * the newer screen is on top. The closing one may still cover more (it is followed until the two
 * cross), but content left in it would be under the newer one, out of sight. The open pair takes it;
 * it starts from where the content is in the closing pair (see resolveMovingHandoffSource), so the
 * move does not jump.
 */
function preferOpenPair(
	receiver: string,
	boundaryId: string,
	state: BoundaryPresentationState,
	p: BoundaryPairPresentation | undefined,
) {
	"worklet";
	if (!p?.closing || p.sourceKey !== receiver) return p;
	const linkKey = getLinkKeyFromTag(boundaryId);
	for (const value of state.presentations) {
		const candidate = value?.get();
		if (!candidate?.ready || candidate.closing) continue;
		if (candidate.pairKey === p.pairKey) continue;
		const link = state.pairs[candidate.pairKey]?.links[linkKey];
		if (!link) continue;
		const sourceKey = link.source?.screenKey ?? candidate.sourceKey;
		if (sourceKey !== receiver) continue;
		return {
			...candidate,
			sourceKey,
			destinationKey: link.destination?.screenKey ?? candidate.destinationKey,
		};
	}
	return p;
}

/**
 * Where a handoff boundary's content is presented: the screen whose receiver it is in, and that
 * receiver's slot (its style says how big the receiver is this frame).
 */
export function resolveBoundaryHandoffTarget(
	screenKey: string,
	boundaryId: string,
	state: BoundaryPresentationState,
) {
	"worklet";
	let receiver = screenKey;
	let receiverSlot: BoundaryPairPresentation["source"][string] | undefined;
	const visited: Record<string, true> = {};
	// `following` is this boundary's own screen's next route; further along the chain (a payload
	// handed on from screen to screen) each receiver follows its own screen's next route.
	while (!visited[receiver]) {
		visited[receiver] = true;
		const p = preferOpenPair(
			receiver,
			boundaryId,
			state,
			resolveBoundaryPresentation(
				receiver,
				boundaryId,
				receiver === screenKey
					? state
					: { ...state, following: state.nextByScreen?.[receiver] },
			),
		);
		if (!p) break;
		const slot = (p.sourceKey === receiver ? p.source : p.destination)[
			boundaryId
		];
		const next = resolveBoundaryReceiver(
			p,
			slot?.props?.handoffTarget ??
				p.destination[boundaryId]?.props?.handoffTarget ??
				p.source[boundaryId]?.props?.handoffTarget,
			receiver,
		);
		if (next === receiver || !state.entries[boundaryId]?.screens[next]?.handoff)
			break;
		receiver = next;
		receiverSlot = (next === p.destinationKey ? p.destination : p.source)[
			boundaryId
		];
	}
	return { receiver, slot: receiverSlot };
}

export function resolveBoundaryHandoff(
	screenKey: string,
	boundaryId: string,
	state: BoundaryPresentationState,
) {
	"worklet";
	return resolveBoundaryHandoffTarget(screenKey, boundaryId, state).receiver;
}
