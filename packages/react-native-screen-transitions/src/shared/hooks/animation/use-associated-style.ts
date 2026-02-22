import {
	type StyleProps,
	useAnimatedProps,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { EPSILON, NO_PROPS, NO_STYLES } from "../../constants";
import { useKeys } from "../../providers/screen/keys.provider";
import { useScreenStyles } from "../../providers/screen/styles.provider";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds.store";

type Props = {
	id?: string;
	style?: StyleProps;
	resetTransformOnUnset?: boolean;
	waitForFirstResolvedStyle?: boolean;
};

const TRANSIENT_EMPTY_GRACE_FRAMES = 2;
const TRANSITION_PROGRESS_COMPLETE = 1 - EPSILON;
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

type AssociatedStyleMode = "waiting-first-style" | "hold-last-style" | "live";

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
 * guarding against one-frame glitches during shared-boundary transitions.
 *
 * Why this exists:
 * - During push/pop, links and style maps can be briefly out of sync.
 * - Without guards, boundaries can flash raw layout for one frame.
 * - Cleanup must be deterministic so stale transform keys do not linger.
 *
 * Visual model (worklet state machine):
 *
 *   expected transition + no resolved style yet -> waiting-first-style
 *   expected transition + transient empty style map -> hold-last-style
 *   otherwise -> live
 *
 * - `waiting-first-style`: return `opacity: 0` until first resolved style arrives.
 * - `hold-last-style`: reuse last resolved style through short empty-map gaps.
 * - `live`: apply current resolved style directly.
 *
 * For grouped tags (`group:id`), previous-screen transition evidence is only
 * considered for the group's active member to avoid hiding non-active siblings.
 *
 * Set `waitForFirstResolvedStyle` to `false` for generic shared-bound-tag usage
 * where the transition can be driven by other style ids.
 */
export const useAssociatedStyles = ({
	id,
	resetTransformOnUnset = false,
	waitForFirstResolvedStyle = true,
}: Props = {}) => {
	const { stylesMap, ancestorStylesMaps } = useScreenStyles();
	const { previous, current, next } = useKeys();

	const hasConfiguredInterpolator =
		!!current.options.screenStyleInterpolator ||
		!!next?.options?.screenStyleInterpolator;

	const previousScreenKey = previous?.route.key;
	const currentScreenKey = current.route.key;
	const isAnimating = AnimationStore.getAnimation(
		currentScreenKey,
		"animating",
	);
	const progress = AnimationStore.getAnimation(currentScreenKey, "progress");
	const isClosing = AnimationStore.getAnimation(currentScreenKey, "closing");
	const previousAppliedKeys = useSharedValue<Record<string, true>>({});
	const emptyGraceFrameCount = useSharedValue(0);
	const lastResolvedBase = useSharedValue<Record<string, any> | null>(null);

	const associatedStyles = useAnimatedStyle(() => {
		"worklet";

		if (!id) {
			return NO_STYLES;
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
		const isTransitionProgressInFlight =
			progress.get() < TRANSITION_PROGRESS_COMPLETE;
		const isTransitionInFlight =
			isTransitioning || isTransitionProgressInFlight;

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

		// Split intent:
		// - incoming: strict signal for first-style hiding
		// - in-flight: broad signal to keep existing styles from resetting
		const shouldExpectIncomingStyle =
			resetTransformOnUnset &&
			((hasActiveLink && canUsePreviousTransitionEvidence) ||
				hasPreviousTransitionEvidence);

		const shouldProtectInFlightStyles =
			resetTransformOnUnset && (hasActiveLink || hasPreviousTransitionEvidence);

		if (hasCurrentKeys) {
			lastResolvedBase.value = base as Record<string, any>;
		}

		const hasPersistedResolvedStyle = !!lastResolvedBase.value;
		const hasResolvedStyle = hasCurrentKeys || hasPersistedResolvedStyle;

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

		const shouldDeferUnset =
			resetTransformOnUnset &&
			shouldProtectInFlightStyles &&
			(isTransitioning || isWithinGapGrace);

		/**
		 * Associated-style state machine:
		 * - waiting-first-style: transition is expected but no style has resolved yet.
		 * - hold-last-style: transient empty frame; reuse last resolved style.
		 * - live: apply current resolved style normally.
		 */
		let mode: AssociatedStyleMode = "live";
		if (
			waitForFirstResolvedStyle &&
			resetTransformOnUnset &&
			hasConfiguredInterpolator &&
			shouldExpectIncomingStyle &&
			isTransitionInFlight &&
			!hasResolvedStyle
		) {
			mode = "waiting-first-style";
		} else if (
			shouldDeferUnset &&
			!hasCurrentKeys &&
			hasPersistedResolvedStyle
		) {
			mode = "hold-last-style";
		}

		const resolvedBase =
			mode === "hold-last-style"
				? (lastResolvedBase.value as Record<string, any>)
				: (base as Record<string, any>);

		const unsetPatch = buildUnsetPatch({
			previousKeys: previousAppliedKeys.value,
			currentKeys,
			shouldDeferUnset,
			resetTransformOnUnset,
		});

		if (shouldDeferUnset) {
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

		if (mode === "waiting-first-style") {
			return { ...unsetPatch, opacity: 0 };
		}

		const mergedBase = { ...unsetPatch, ...resolvedBase };

		let opacity = 1;

		if ("opacity" in mergedBase) {
			opacity = mergedBase.opacity as number;
		}

		if ("opacity" in mergedBase) {
			return mergedBase;
		}

		return { ...mergedBase, opacity };
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

	return { associatedStyles, associatedProps };
};
