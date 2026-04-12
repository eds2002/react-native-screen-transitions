import { NO_STYLES } from "../../../../constants";
import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";
import { ALWAYS_RESET_STYLE_VALUES, IDENTITY_TRANSFORM } from "../constants";

export type ResettableStyleKeySet = Record<string, true>;

type ResettableStyleKeyMeta = {
	resettableKeys: ResettableStyleKeySet;
	hasAnyStyleKeys: boolean;
};

const isResettableStyleKey = (key: string) => {
	"worklet";
	return key === "transform" || key in ALWAYS_RESET_STYLE_VALUES;
};

const hasResettableStyleKeys = (keys: ResettableStyleKeySet) => {
	"worklet";
	for (const _key in keys) {
		return true;
	}
	return false;
};

const collectResettableStyleKeyMeta = (
	record?: Record<string, unknown>,
): ResettableStyleKeyMeta => {
	"worklet";
	const resettableKeys: ResettableStyleKeySet = {};
	let hasAnyStyleKeys = false;

	if (!record) {
		return { resettableKeys, hasAnyStyleKeys };
	}

	for (const key in record) {
		hasAnyStyleKeys = true;

		if (isResettableStyleKey(key)) {
			resettableKeys[key] = true;
		}
	}

	return { resettableKeys, hasAnyStyleKeys };
};

const collectRelevantSlotIds = ({
	currentStylesMap,
	fallbackStylesMap,
	previousStyleKeysBySlot,
}: {
	currentStylesMap: NormalizedTransitionInterpolatedStyle;
	fallbackStylesMap: NormalizedTransitionInterpolatedStyle;
	previousStyleKeysBySlot: Record<string, ResettableStyleKeySet>;
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
	previousKeys: ResettableStyleKeySet;
	currentKeys: ResettableStyleKeySet;
}) => {
	"worklet";
	const unsetPatch: Record<string, any> = {};
	let hasUnsetPatch = false;

	for (const key in previousKeys) {
		if (currentKeys[key]) continue;

		if (key === "transform") {
			unsetPatch.transform = IDENTITY_TRANSFORM;
			hasUnsetPatch = true;
			continue;
		}

		if (key in ALWAYS_RESET_STYLE_VALUES) {
			unsetPatch[key] =
				ALWAYS_RESET_STYLE_VALUES[
					key as keyof typeof ALWAYS_RESET_STYLE_VALUES
				];
			hasUnsetPatch = true;
		}
	}

	return {
		unsetPatch,
		hasUnsetPatch,
	};
};

export const buildResolvedStyleMap = ({
	currentStylesMap,
	fallbackStylesMap,
	previousStyleKeysBySlot,
}: {
	currentStylesMap: NormalizedTransitionInterpolatedStyle;
	fallbackStylesMap: NormalizedTransitionInterpolatedStyle;
	previousStyleKeysBySlot: Record<string, ResettableStyleKeySet>;
}) => {
	"worklet";
	const resolvedStylesMap: NormalizedTransitionInterpolatedStyle = {};
	const nextPreviousStyleKeysBySlot: Record<string, ResettableStyleKeySet> = {};

	const slotIds = collectRelevantSlotIds({
		currentStylesMap,
		fallbackStylesMap,
		previousStyleKeysBySlot,
	});

	for (const slotId in slotIds) {
		const slot = currentStylesMap[slotId] ?? fallbackStylesMap[slotId];
		const baseStyle = slot?.style as Record<string, unknown> | undefined;
		const { resettableKeys: currentKeys, hasAnyStyleKeys } =
			collectResettableStyleKeyMeta(baseStyle);

		// Only reset transition-owned keys that can strand visual state on the
		// view. Everything else should fall back to the component's own styles.
		const { unsetPatch, hasUnsetPatch } = buildUnsetPatch({
			previousKeys: previousStyleKeysBySlot[slotId] ?? {},
			currentKeys,
		});
		const hasProps = slot?.props !== undefined;

		if (!slot && !hasUnsetPatch) {
			continue;
		}

		const resolvedStyle =
			hasAnyStyleKeys || hasUnsetPatch
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

		if (hasResettableStyleKeys(currentKeys)) {
			nextPreviousStyleKeysBySlot[slotId] = currentKeys;
		}
	}

	return {
		resolvedStylesMap,
		nextPreviousStyleKeysBySlot,
	};
};
