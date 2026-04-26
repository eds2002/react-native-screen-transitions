import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";
import {
	ALWAYS_RESET_STYLE_VALUES,
	IDENTITY_TRANSFORM,
	shouldSlotInherit,
} from "../constants";

export type ResettableStyleState = {
	hasTransform: boolean;
	hasOpacity: boolean;
	hasZIndex: boolean;
	hasElevation: boolean;
};

export type ResettableStyleStatesBySlot = Record<string, ResettableStyleState>;

const EMPTY_RESETTABLE_STYLE_STATE = Object.freeze({
	hasTransform: false,
	hasOpacity: false,
	hasZIndex: false,
	hasElevation: false,
}) as ResettableStyleState;

export const resolveSlotStyles = ({
	currentStylesMap,
	ancestorStylesMap,
	previousStyleStatesBySlot,
}: {
	currentStylesMap: NormalizedTransitionInterpolatedStyle;
	ancestorStylesMap: NormalizedTransitionInterpolatedStyle;
	previousStyleStatesBySlot: ResettableStyleStatesBySlot;
}) => {
	"worklet";
	const resolvedStylesMap: NormalizedTransitionInterpolatedStyle = {};
	const nextPreviousStyleStatesBySlot: ResettableStyleStatesBySlot = {};

	const appendResolvedSlot = (slotId: string) => {
		"worklet";

		const slot =
			currentStylesMap[slotId] ??
			(shouldSlotInherit(slotId) ? ancestorStylesMap[slotId] : undefined);

		const baseStyle = slot?.style as Record<string, unknown> | undefined;

		let hasAnyStyleKeys = false;
		let hasTransform = false;
		let hasOpacity = false;
		let hasZIndex = false;
		let hasElevation = false;

		if (baseStyle) {
			for (const key in baseStyle) {
				hasAnyStyleKeys = true;

				if (key === "transform") {
					hasTransform = true;
					continue;
				}

				if (key === "opacity") {
					hasOpacity = true;
					continue;
				}

				if (key === "zIndex") {
					hasZIndex = true;
					continue;
				}

				if (key === "elevation") {
					hasElevation = true;
				}
			}
		}

		const previousState =
			previousStyleStatesBySlot[slotId] ?? EMPTY_RESETTABLE_STYLE_STATE;
		const shouldResetTransform = previousState.hasTransform && !hasTransform;
		const shouldResetOpacity = previousState.hasOpacity && !hasOpacity;
		const shouldResetZIndex = previousState.hasZIndex && !hasZIndex;
		const shouldResetElevation = previousState.hasElevation && !hasElevation;
		const hasResetPatch =
			shouldResetTransform ||
			shouldResetOpacity ||
			shouldResetZIndex ||
			shouldResetElevation;
		const hasProps = slot?.props !== undefined;

		if (hasTransform || hasOpacity || hasZIndex || hasElevation) {
			nextPreviousStyleStatesBySlot[slotId] = {
				hasTransform,
				hasOpacity,
				hasZIndex,
				hasElevation,
			};
		}

		if (!slot && !hasResetPatch) {
			return;
		}

		if (!hasResetPatch && slot) {
			if (hasAnyStyleKeys || hasProps) {
				resolvedStylesMap[slotId] = slot;
			}
			return;
		}

		if (!hasAnyStyleKeys && !hasResetPatch && !hasProps) {
			return;
		}

		const resolvedSlot = {} as NormalizedTransitionSlotStyle;

		if (hasAnyStyleKeys || hasResetPatch) {
			const resolvedStyle: Record<string, any> = {};

			if (shouldResetTransform) {
				resolvedStyle.transform = IDENTITY_TRANSFORM;
			}

			if (shouldResetOpacity) {
				resolvedStyle.opacity = ALWAYS_RESET_STYLE_VALUES.opacity;
			}

			if (shouldResetZIndex) {
				resolvedStyle.zIndex = ALWAYS_RESET_STYLE_VALUES.zIndex;
			}

			if (shouldResetElevation) {
				resolvedStyle.elevation = ALWAYS_RESET_STYLE_VALUES.elevation;
			}

			if (baseStyle) {
				for (const key in baseStyle) {
					resolvedStyle[key] = baseStyle[key];
				}
			}

			resolvedSlot.style = resolvedStyle;
		}

		if (hasProps) {
			resolvedSlot.props = slot?.props;
		}

		if (!resolvedSlot.style && !resolvedSlot.props) {
			return;
		}

		resolvedStylesMap[slotId] = resolvedSlot;
	};

	for (const slotId in currentStylesMap) {
		appendResolvedSlot(slotId);
	}

	for (const slotId in ancestorStylesMap) {
		if (!shouldSlotInherit(slotId)) {
			continue;
		}

		if (currentStylesMap[slotId] !== undefined) {
			continue;
		}

		appendResolvedSlot(slotId);
	}

	for (const slotId in previousStyleStatesBySlot) {
		if (currentStylesMap[slotId] !== undefined) {
			continue;
		}

		if (shouldSlotInherit(slotId) && ancestorStylesMap[slotId] !== undefined) {
			continue;
		}

		appendResolvedSlot(slotId);
	}

	return {
		resolvedStylesMap,
		nextPreviousStyleStatesBySlot,
	};
};
