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
};

export function resolveBoundaryPresentation(
	screenKey: string,
	boundaryId: string,
	state: BoundaryPresentationState,
) {
	"worklet";
	const linkKey = getLinkKeyFromTag(boundaryId);
	let result: BoundaryPairPresentation | undefined;
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
		// A preparing or completed pair cannot displace a live presentation.
		if (result && !presentation.ready) continue;
		result = { ...presentation, sourceKey, destinationKey };
	}
	return result;
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

export function resolveBoundaryHandoff(
	screenKey: string,
	boundaryId: string,
	state: BoundaryPresentationState,
) {
	"worklet";
	let receiver = screenKey;
	const visited: Record<string, true> = {};
	while (!visited[receiver]) {
		visited[receiver] = true;
		const p = resolveBoundaryPresentation(receiver, boundaryId, state);
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
	}
	return receiver;
}
