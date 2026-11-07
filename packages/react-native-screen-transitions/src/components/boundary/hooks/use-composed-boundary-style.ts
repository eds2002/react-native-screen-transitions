import { useEffect, useMemo, useState } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import {
	type SharedValue,
	type StyleProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../constants";
import { STYLE_RESET_VALUES } from "../../../providers/orchestrator/styles/constants";
import {
	composeSlotStyleWithLocalTransform,
	getLocalTransformForSlotComposition,
} from "../../../providers/orchestrator/styles/helpers/compose-slot-style";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import { queueForgetAppliedStyleKeys } from "../coordinator/measure-registry";
import {
	type BoundaryEscapeState,
	isBoundaryEscaped,
} from "../portal/utils/is-escaped";
import {
	appliedStyleKeys,
	nextAppliedStyleKey,
} from "../utils/applied-style-keys";

export function useComposedBoundaryStyle(
	slots: SharedValue<NormalizedTransitionInterpolatedStyle> | undefined,
	id: string | undefined,
	style?: unknown,
	kind: "full" | "stacking" | "layout" = "full",
	/** A boundary that can escape: while its frame is in the overlay host, keep only layout here (the host applies the rest). */
	escapeState?: BoundaryEscapeState,
) {
	const local = useMemo(
		() => getLocalTransformForSlotComposition(style),
		[style],
	);

	const baseLayout = useMemo(
		() => StyleSheet.flatten(style as ViewStyle) ?? {},
		[style],
	);

	// Keys this style set last frame (see applied-style-keys). Reanimated leaves a key that drops out
	// of an animated style at its last value, so a boundary that escapes while hidden (opacity 0 from
	// its slot) would keep that opacity on its escaped root.
	const [styleKey] = useState(nextAppliedStyleKey);
	useEffect(() => () => queueForgetAppliedStyleKeys(styleKey), [styleKey]);

	return useAnimatedStyle(() => {
		const style = resolveStyle();
		const applied = appliedStyleKeys.get()[styleKey];
		const reset: StyleProps = {};
		let hasReset = false;
		for (const key in applied) {
			if (key in style) continue;
			const value =
				(baseLayout as Record<string, unknown>)[key] ?? STYLE_RESET_VALUES[key];
			if (value === undefined) continue;
			reset[key] = value;
			hasReset = true;
		}
		appliedStyleKeys.modify((byStyle) => {
			"worklet";
			let keys = byStyle[styleKey];
			if (keys) for (const key in keys) delete keys[key];
			else {
				keys = {};
				byStyle[styleKey] = keys;
			}
			for (const key in style) keys[key] = true;
			return byStyle;
		}, false);
		return hasReset ? { ...reset, ...style } : style;

		function resolveStyle(): StyleProps {
			const slot = id ? slots?.get()[id] : undefined;
			const value: StyleProps = slot?.style ?? NO_STYLES;
			const effectiveKind =
				kind === "full" && escapeState && isBoundaryEscaped(escapeState)
					? "layout"
					: kind;
			if (effectiveKind === "stacking")
				return { zIndex: value.zIndex ?? 0, elevation: value.elevation ?? 0 };

			if (effectiveKind === "layout") {
				const {
					width,
					height,
					minWidth,
					minHeight,
					maxWidth,
					maxHeight,
					aspectRatio,
				} = value;

				return {
					width: width ?? baseLayout.width,
					height: height ?? baseLayout.height,
					minWidth: minWidth ?? baseLayout.minWidth,
					minHeight: minHeight ?? baseLayout.minHeight,
					maxWidth: maxWidth ?? baseLayout.maxWidth,
					maxHeight: maxHeight ?? baseLayout.maxHeight,
					aspectRatio: aspectRatio ?? baseLayout.aspectRatio,
				};
			}
			return composeSlotStyleWithLocalTransform(value, local);
		}
	});
}
