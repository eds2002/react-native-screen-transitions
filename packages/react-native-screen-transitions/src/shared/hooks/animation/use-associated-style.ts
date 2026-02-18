import {
	type StyleProps,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { EPSILON, NO_STYLES } from "../../constants";
import { useKeys } from "../../providers/screen/keys.provider";
import { useScreenStyles } from "../../providers/screen/styles.provider";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds.store";

type Props = {
	id?: string;
	style?: StyleProps;
	resetTransformOnUnset?: boolean;
};

const TRANSIENT_EMPTY_GRACE_FRAMES = 2;
const TRANSITION_PROGRESS_COMPLETE = 1 - EPSILON;
const IDENTITY_TRANSFORM = [
	{ translateX: 0 },
	{ translateY: 0 },
	{ scaleX: 1 },
	{ scaleY: 1 },
] as any;

const hasAnyKeys = (record: Record<string, unknown>) => {
	"worklet";
	for (const _key in record) {
		return true;
	}
	return false;
};

const toKeySet = (record: Record<string, unknown>) => {
	"worklet";
	const keys: Record<string, true> = {};
	for (const key in record) {
		keys[key] = true;
	}
	return keys;
};

const getGroupTagParts = (tag: string) => {
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

/**
 * This hook is used to get the associated styles for a given styleId / boundTag.
 */
export const useAssociatedStyles = ({
	id,
	resetTransformOnUnset = false,
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

		// Check local styles first, then fall back to parent
		const ownStyle = stylesMap.value[id];

		const ancestorStyle = ancestorStylesMaps.find(
			(ancestorMap) => ancestorMap.value[id],
		)?.value[id];

		const base = ownStyle || ancestorStyle || NO_STYLES;

		const currentKeys = toKeySet(base as Record<string, unknown>);
		const hasCurrentKeys = hasAnyKeys(currentKeys);
		const hasPreviousKeys = hasAnyKeys(previousAppliedKeys.value);

		const isTransitioning = isAnimating.get() !== 0 || isClosing.get() !== 0;
		const isTransitionProgressInFlight =
			progress.get() < TRANSITION_PROGRESS_COMPLETE;

		const hasActiveLink =
			resetTransformOnUnset &&
			(BoundStore.hasPendingLink(id) ||
				BoundStore.hasSourceLink(id, currentScreenKey) ||
				BoundStore.hasDestinationLink(id, currentScreenKey));

		const groupTagParts = resetTransformOnUnset ? getGroupTagParts(id) : null;
		const activeGroupMemberId = groupTagParts
			? BoundStore.getGroupActiveId(groupTagParts.group)
			: null;

		const allowPreviousTransitionEvidence =
			!groupTagParts ||
			(activeGroupMemberId !== null &&
				activeGroupMemberId === groupTagParts.memberId);

		const hasRelevantActiveLink =
			hasActiveLink && allowPreviousTransitionEvidence;

		const hasPreviousTransitionEvidence =
			resetTransformOnUnset &&
			allowPreviousTransitionEvidence &&
			!!previousScreenKey &&
			(!!BoundStore.getSnapshot(id, previousScreenKey) ||
				BoundStore.hasBoundaryPresence(id, previousScreenKey));

		const shouldExpectTransitionStyle =
			resetTransformOnUnset &&
			(hasRelevantActiveLink || hasPreviousTransitionEvidence);

		if (hasCurrentKeys) {
			lastResolvedBase.value = base as Record<string, any>;
		}

		const shouldHideUntilFirstResolvedStyle =
			resetTransformOnUnset &&
			hasConfiguredInterpolator &&
			shouldExpectTransitionStyle &&
			(isTransitioning || isTransitionProgressInFlight) &&
			!hasCurrentKeys &&
			!lastResolvedBase.value;

		const hasPersistedResolvedStyle = !!lastResolvedBase.value;

		const isTransientEmptyGap =
			hasConfiguredInterpolator &&
			shouldExpectTransitionStyle &&
			!isTransitioning &&
			!hasCurrentKeys &&
			(hasPreviousKeys || hasPersistedResolvedStyle);

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
			shouldExpectTransitionStyle &&
			(isTransitioning || isWithinGapGrace);

		const resolvedBase =
			shouldDeferUnset && !hasCurrentKeys && hasPersistedResolvedStyle
				? (lastResolvedBase.value as Record<string, any>)
				: (base as Record<string, any>);

		const unsetPatch: Record<string, any> = {};
		for (const key in previousAppliedKeys.value) {
			if (!currentKeys[key]) {
				if (shouldDeferUnset) {
					continue;
				}

				if (key === "transform" && resetTransformOnUnset) {
					unsetPatch.transform = IDENTITY_TRANSFORM;
				} else {
					unsetPatch[key] = undefined;
				}
			}
		}

		if (shouldDeferUnset) {
			previousAppliedKeys.value = {
				...previousAppliedKeys.value,
				...currentKeys,
			};
		} else {
			previousAppliedKeys.value = currentKeys;

			if (!hasCurrentKeys && !shouldExpectTransitionStyle && !isTransitioning) {
				lastResolvedBase.value = null;
			}
		}

		if (shouldHideUntilFirstResolvedStyle) {
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

	return { associatedStyles };
};
