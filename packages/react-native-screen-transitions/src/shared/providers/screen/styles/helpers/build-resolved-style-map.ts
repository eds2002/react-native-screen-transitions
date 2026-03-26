import { NO_STYLES } from "../../../../constants";
import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";

export type StyleKeySet = Record<string, true>;

type StyleKeyMeta = {
	keys: StyleKeySet;
	hasAny: boolean;
};

const IDENTITY_TRANSFORM = [
	{ translateX: 0 },
	{ translateY: 0 },
	{ scaleX: 1 },
	{ scaleY: 1 },
] as const;

const ALWAYS_RESET_STYLE_VALUES = {
	zIndex: 0,
	elevation: 0,
} as const;

const hasAnyKeys = (record: Record<string, unknown>) => {
	"worklet";
	for (const _key in record) {
		return true;
	}
	return false;
};

const collectStyleKeyMeta = (
	record?: Record<string, unknown>,
): StyleKeyMeta => {
	"worklet";
	const keys: StyleKeySet = {};
	let hasAny = false;

	if (!record) {
		return { keys, hasAny };
	}

	for (const key in record) {
		keys[key] = true;
		hasAny = true;
	}

	return { keys, hasAny };
};

const collectRelevantSlotIds = ({
	currentStylesMap,
	fallbackStylesMap,
	previousStyleKeysBySlot,
}: {
	currentStylesMap: NormalizedTransitionInterpolatedStyle;
	fallbackStylesMap: NormalizedTransitionInterpolatedStyle;
	previousStyleKeysBySlot: Record<string, StyleKeySet>;
}) => {
	"worklet";
	const slotIds: Record<string, true> = {};

	for (const slotId in currentStylesMap) {
		slotIds[slotId] = true;
	}

	for (const slotId in fallbackStylesMap) {
		slotIds[slotId] = true;
	}

	for (const slotId in previousStyleKeysBySlot) {
		slotIds[slotId] = true;
	}

	return slotIds;
};

const buildUnsetPatch = ({
	previousKeys,
	currentKeys,
}: {
	previousKeys: StyleKeySet;
	currentKeys: StyleKeySet;
}) => {
	"worklet";
	const unsetPatch: Record<string, any> = {};

	for (const key in previousKeys) {
		if (currentKeys[key]) continue;

		if (key === "transform") {
			unsetPatch.transform = IDENTITY_TRANSFORM;
			continue;
		}

		if (key in ALWAYS_RESET_STYLE_VALUES) {
			unsetPatch[key] =
				ALWAYS_RESET_STYLE_VALUES[
					key as keyof typeof ALWAYS_RESET_STYLE_VALUES
				];
			continue;
		}

		unsetPatch[key] = undefined;
	}

	return unsetPatch;
};

export const buildResolvedStyleMap = ({
	currentStylesMap,
	fallbackStylesMap,
	previousStyleKeysBySlot,
}: {
	currentStylesMap: NormalizedTransitionInterpolatedStyle;
	fallbackStylesMap: NormalizedTransitionInterpolatedStyle;
	previousStyleKeysBySlot: Record<string, StyleKeySet>;
}): {
	resolvedStylesMap: NormalizedTransitionInterpolatedStyle;
	nextPreviousStyleKeysBySlot: Record<string, StyleKeySet>;
} => {
	"worklet";
	const resolvedStylesMap: NormalizedTransitionInterpolatedStyle = {};
	const nextPreviousStyleKeysBySlot: Record<string, StyleKeySet> = {};

	const slotIds = collectRelevantSlotIds({
		currentStylesMap,
		fallbackStylesMap,
		previousStyleKeysBySlot,
	});

	for (const slotId in slotIds) {
		const slot = currentStylesMap[slotId] ?? fallbackStylesMap[slotId];
		const baseStyle = slot?.style as Record<string, unknown> | undefined;
		const { keys: currentKeys, hasAny: hasCurrentStyleKeys } =
			collectStyleKeyMeta(baseStyle);

		const unsetPatch = buildUnsetPatch({
			previousKeys: previousStyleKeysBySlot[slotId] ?? {},
			currentKeys,
		});

		const hasUnsetPatch = hasAnyKeys(unsetPatch);
		const hasProps = slot?.props !== undefined;

		if (!slot && !hasUnsetPatch) {
			continue;
		}

		const resolvedStyle =
			hasCurrentStyleKeys || hasUnsetPatch
				? {
						...unsetPatch,
						...(slot?.style ?? NO_STYLES),
					}
				: undefined;

		if (resolvedStyle === undefined && !hasProps) {
			continue;
		}

		const resolvedSlot = {} as NormalizedTransitionSlotStyle;

		if (resolvedStyle !== undefined) {
			resolvedSlot.style = resolvedStyle;
		}

		if (hasProps) {
			resolvedSlot.props = slot?.props;
		}

		resolvedStylesMap[slotId] = resolvedSlot;

		if (hasCurrentStyleKeys) {
			nextPreviousStyleKeysBySlot[slotId] = currentKeys;
		}
	}

	return {
		resolvedStylesMap,
		nextPreviousStyleKeysBySlot,
	};
};
