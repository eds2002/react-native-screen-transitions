import {
	type StyleProps,
	useAnimatedProps,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../constants";
import { useDescriptorDerivations } from "../../providers/screen/descriptors";
import { useScreenStyles } from "../../providers/screen/styles.provider";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds";

type Props = {
	id?: string;
	style?: StyleProps;
	resetTransformOnUnset?: boolean;
};

const TRANSIENT_EMPTY_GRACE_FRAMES = 2;
const IDENTITY_TRANSFORM = [
	{ translateX: 0 },
	{ translateY: 0 },
	{ scaleX: 1 },
	{ scaleY: 1 },
] as any;
const ALWAYS_RESET_STYLE_VALUES = {
	zIndex: 0,
	elevation: 0,
} as const;

type AssociatedStyleMode = "hold-last-style" | "live";

type GroupTagParts = {
	group: string;
	memberId: string;
};

type KeyMeta = {
	keys: Record<string, true>;
	hasAny: boolean;
};

const hasAnyKeys = (record: Record<string, unknown>) => {
	"worklet";
	for (const _key in record) {
		return true;
	}
	return false;
};

const collectKeyMeta = (record: Record<string, unknown>): KeyMeta => {
	"worklet";
	const keys: Record<string, true> = {};
	let hasAny = false;
	for (const key in record) {
		keys[key] = true;
		hasAny = true;
	}
	return { keys, hasAny };
};

const getGroupTagParts = (tag: string): GroupTagParts | null => {
	"worklet";
	const separatorIndex = tag.indexOf(":");
	if (separatorIndex <= 0 || separatorIndex >= tag.length - 1) {
		return null;
	}

	return {
		group: tag.slice(0, separatorIndex),
		memberId: tag.slice(separatorIndex + 1),
	};
};

const allowPreviousTransitionEvidence = (tag: string): boolean => {
	"worklet";
	const groupTagParts = getGroupTagParts(tag);
	if (!groupTagParts) {
		return true;
	}

	// For grouped boundaries, only the active member can inherit
	// transition evidence from the previous screen.
	const activeGroupMemberId = BoundStore.getGroupActiveId(groupTagParts.group);
	return (
		activeGroupMemberId !== null &&
		activeGroupMemberId === groupTagParts.memberId
	);
};

const buildUnsetPatch = ({
	previousKeys,
	currentKeys,
	shouldDeferUnset,
	resetTransformOnUnset,
}: {
	previousKeys: Record<string, true>;
	currentKeys: Record<string, true>;
	shouldDeferUnset: boolean;
	resetTransformOnUnset: boolean;
}) => {
	"worklet";
	const unsetPatch: Record<string, any> = {};

	for (const key in previousKeys) {
		if (currentKeys[key]) continue;
		const shouldAlwaysUnset = key in ALWAYS_RESET_STYLE_VALUES;
		if (shouldDeferUnset && !shouldAlwaysUnset) continue;

		if (key === "transform" && resetTransformOnUnset) {
			unsetPatch.transform = IDENTITY_TRANSFORM;
		} else if (key in ALWAYS_RESET_STYLE_VALUES) {
			unsetPatch[key] =
				ALWAYS_RESET_STYLE_VALUES[
					key as keyof typeof ALWAYS_RESET_STYLE_VALUES
				];
		} else {
			unsetPatch[key] = undefined;
		}
	}

	return unsetPatch;
};

/**
 * Resolves the animated style associated with an `id` (styleId/bound tag), while
 * guarding against transient glitches during shared-boundary transitions.
 *
 * Why this exists:
 * - During push/pop, links and style maps can be briefly out of sync.
 * - Without guards, boundaries can briefly drop back to raw local layout.
 * - Cleanup must be deterministic so stale transform keys do not linger.
 *
 * Local style model (worklet state machine):
 *
 *   transient empty style map -> hold-last-style
 *   otherwise -> live
 *
 * - `hold-last-style`: reuse last resolved style through short empty-map gaps.
 * - `live`: apply current resolved style directly.
 *
 * For grouped tags (`group:id`), previous-screen transition evidence is only
 * considered for the group's active member to avoid hiding non-active siblings.
 */
export const useAssociatedStyles = ({
	id,
	resetTransformOnUnset = false,
}: Props = {}) => {
	const { stylesMap, ancestorStylesMaps } = useScreenStyles();
	const { previousScreenKey, currentScreenKey, hasConfiguredInterpolator } =
		useDescriptorDerivations();
	const isAnimating = AnimationStore.getValue(currentScreenKey, "animating");
	const isClosing = AnimationStore.getValue(currentScreenKey, "closing");
	const previousAppliedKeys = useSharedValue<Record<string, true>>({});
	const emptyGraceFrameCount = useSharedValue(0);
	const lastResolvedBase = useSharedValue<Record<string, any> | null>(null);

	const resolvedAssociatedBase = useDerivedValue<Record<string, any>>(() => {
		"worklet";

		if (!id) {
			return NO_STYLES as Record<string, any>;
		}

		// Check local slot first, then fall back to parent
		const ownSlot = stylesMap.value[id];

		const ancestorSlot = ancestorStylesMaps.find(
			(ancestorMap) => ancestorMap.value[id],
		)?.value[id];

		const slot = ownSlot || ancestorSlot;
		const base = slot?.style || NO_STYLES;

		const { keys: currentKeys, hasAny: hasCurrentKeys } = collectKeyMeta(
			base as Record<string, unknown>,
		);

		const hasPreviousKeys = hasAnyKeys(previousAppliedKeys.value);
		const isTransitioning = isAnimating.get() !== 0 || isClosing.get() !== 0;

		const canUsePreviousTransitionEvidence =
			resetTransformOnUnset && allowPreviousTransitionEvidence(id);

		const hasActiveLink =
			resetTransformOnUnset &&
			canUsePreviousTransitionEvidence &&
			(BoundStore.hasPendingLink(id) ||
				BoundStore.hasSourceLink(id, currentScreenKey) ||
				BoundStore.hasDestinationLink(id, currentScreenKey));

		const hasPreviousTransitionEvidence =
			canUsePreviousTransitionEvidence &&
			!!previousScreenKey &&
			(!!BoundStore.getSnapshot(id, previousScreenKey) ||
				BoundStore.hasBoundaryPresence(id, previousScreenKey));

		const shouldProtectInFlightStyles =
			resetTransformOnUnset && (hasActiveLink || hasPreviousTransitionEvidence);

		if (hasCurrentKeys) {
			lastResolvedBase.value = base as Record<string, any>;
		}

		const hasPersistedResolvedStyle = !!lastResolvedBase.value;

		const isTransientEmptyGap =
			hasConfiguredInterpolator &&
			shouldProtectInFlightStyles &&
			!isTransitioning &&
			!hasCurrentKeys &&
			(hasPreviousKeys || hasPersistedResolvedStyle);

		// Keep styles stable for a couple of frames to absorb
		// transient empty-map gaps on slower devices.
		if (isTransientEmptyGap) {
			emptyGraceFrameCount.value = emptyGraceFrameCount.value + 1;
		} else {
			emptyGraceFrameCount.value = 0;
		}

		const isWithinGapGrace =
			isTransientEmptyGap &&
			emptyGraceFrameCount.value <= TRANSIENT_EMPTY_GRACE_FRAMES;

		const shouldDelayUnset =
			resetTransformOnUnset &&
			shouldProtectInFlightStyles &&
			(isTransitioning || isWithinGapGrace);

		/**
		 * Associated-style state machine:
		 * - hold-last-style: transient empty frame; reuse last resolved style.
		 * - live: apply current resolved style normally.
		 */
		let mode: AssociatedStyleMode = "live";
		if (shouldDelayUnset && !hasCurrentKeys && hasPersistedResolvedStyle) {
			mode = "hold-last-style";
		}

		const resolvedBase =
			mode === "hold-last-style"
				? (lastResolvedBase.value as Record<string, any>)
				: (base as Record<string, any>);

		const unsetPatch = buildUnsetPatch({
			previousKeys: previousAppliedKeys.value,
			currentKeys,
			shouldDeferUnset: shouldDelayUnset,
			resetTransformOnUnset,
		});

		if (shouldDelayUnset) {
			previousAppliedKeys.value = {
				...previousAppliedKeys.value,
				...currentKeys,
			};
		} else {
			previousAppliedKeys.value = currentKeys;

			// Drop cached style when fully idle so future transitions
			// start from a clean state.
			if (!hasCurrentKeys && !shouldProtectInFlightStyles && !isTransitioning) {
				lastResolvedBase.value = null;
			}
		}

		return { ...unsetPatch, ...resolvedBase };
	});

	const associatedStyles = useAnimatedStyle(() => {
		"worklet";
		const mergedBase = resolvedAssociatedBase.value;

		let opacity = 1;

		if ("opacity" in mergedBase) {
			opacity = mergedBase.opacity as number;
		}

		if ("opacity" in mergedBase) {
			return mergedBase;
		}

		return { ...mergedBase, opacity };
	});

	const associatedStackingStyles = useAnimatedStyle(() => {
		"worklet";
		const mergedBase = resolvedAssociatedBase.value;

		return {
			zIndex: (mergedBase.zIndex as number | undefined) ?? 0,
			elevation: (mergedBase.elevation as number | undefined) ?? 0,
		};
	});

	const associatedProps = useAnimatedProps(() => {
		"worklet";

		if (!id) return NO_PROPS;

		const ownSlot = stylesMap.value[id];
		const ancestorSlot = ancestorStylesMaps.find(
			(ancestorMap) => ancestorMap.value[id],
		)?.value[id];

		return (ownSlot || ancestorSlot)?.props ?? NO_PROPS;
	});

	return { associatedStyles, associatedStackingStyles, associatedProps };
};
