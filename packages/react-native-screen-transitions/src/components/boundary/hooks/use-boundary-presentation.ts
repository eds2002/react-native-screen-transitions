import { useMemo } from "react";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../constants";
import { useOptionalBlankStackStore } from "../../../navigators/blank-stack/state/blank-stack.provider";
import { useBuilderStore } from "../../../providers/builder";
import { useScreenRelationships } from "../../../providers/builder/topology";
import {
	useOptionalOrchestratorStore,
	useOrchestratorStore,
} from "../../../providers/orchestrator";
import {
	areResettableStatesBySlotEqual,
	type ResettableStyleStatesBySlot,
	resolveSlotStyles,
} from "../../../providers/orchestrator/styles/helpers/resolve-slot-styles";
import {
	boundaryRegistry,
	pairs,
} from "../../../stores/bounds/internals/state";
import {
	type BoundaryPresentationState,
	resolveBoundaryHandoff,
	resolveBoundaryPresentation,
} from "../helpers/presentation";

// Screens are discovered through existing providers. React only wires subscriptions;
// their live UI values decide ownership, including retained closing screens.
export function useBoundaryPresentation(boundaryId: string, enabled = true) {
	const screenKey = useBuilderStore((s) => s.derivations.currentScreenKey);
	const scenes = useOptionalBlankStackStore((s) => s?.scenes);
	const keys = useMemo(
		() => (enabled ? (scenes?.map((s) => s.route.key) ?? [screenKey]) : []),
		[scenes, screenKey, enabled],
	);
	const pairPresentations = useOptionalOrchestratorStore(
		keys,
		(s) => s.pairPresentation,
	);
	const localSlots = useOrchestratorStore((s) => s.slotsMap);
	const { parentScreenKey } = useScreenRelationships();
	const ancestorSlots = useOptionalOrchestratorStore(
		parentScreenKey,
		(s) => s.slotsMap,
	);
	const previous = useSharedValue<ResettableStyleStatesBySlot>(NO_PROPS);

	const presentation = useDerivedValue(() => {
		const state: BoundaryPresentationState = {
			presentations: pairPresentations,
			pairs: pairs.get(),
			entries: boundaryRegistry.get(),
		};
		const owner = resolveBoundaryPresentation(screenKey, boundaryId, state);
		const receiver = resolveBoundaryHandoff(screenKey, boundaryId, state);
		const ownedSlot = owner?.ready
			? (owner.sourceKey === screenKey ? owner.source : owner.destination)[
					boundaryId
				]
			: undefined;

		const fallback = localSlots.get()[boundaryId];
		const { resolvedStylesMap, nextPreviousStyleStatesBySlot } =
			resolveSlotStyles({
				localStylesMaps: [{ [boundaryId]: ownedSlot ?? fallback ?? {} }],
				ancestorStylesMap: ownedSlot
					? (ancestorSlots?.get() ?? NO_STYLES)
					: NO_STYLES,
				previousStyleStatesBySlot: previous.get(),
			});
		if (
			!areResettableStatesBySlotEqual(
				previous.get(),
				nextPreviousStyleStatesBySlot,
			)
		) {
			previous.set(nextPreviousStyleStatesBySlot);
		}
		return { owner, receiver, slots: resolvedStylesMap };
	});
	const slotsMap = useDerivedValue(() => presentation.get().slots);
	return { presentation, slotsMap };
}
