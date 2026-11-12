import { useEffect, useMemo, useState } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import {
	type SharedValue,
	type StyleProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../constants";
import {
	composeSlotStyleWithLocalTransform,
	getLocalTransformForSlotComposition,
} from "../../../providers/orchestrator/styles/helpers/compose-slot-style";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import {
	restingStyleValue,
	VISUAL_STYLE_KEYS,
} from "../../../utils/bounds/helpers/styles/visual-styles";
import { queueForgetAppliedStyleKeys } from "../measure/measure-registry";
import {
	type BoundaryEscapeState,
	isBoundaryEscaped,
} from "../portal/utils/is-escaped";
import { appliedStyleKeys, nextAppliedStyleKey } from "./applied-style-keys";

export function useComposedBoundaryStyle(
	slots: SharedValue<NormalizedTransitionInterpolatedStyle> | undefined,
	id: string | undefined,
	style: unknown,
	kind: "full" | "stacking",
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
		let reset: StyleProps | undefined;
		// Mid-transition a style sets the same keys every frame: then nothing resets and the record
		// stays as it is.
		let sameKeys = applied !== undefined;
		let appliedCount = 0;
		for (const key in applied) {
			appliedCount++;
			if (key in style) continue;
			sameKeys = false;
			const value = restingStyleValue(
				key,
				baseLayout as Record<string, unknown>,
			);
			if (value === undefined) continue;
			if (!reset) reset = {};
			reset[key] = value;
		}
		if (sameKeys) {
			let styleCount = 0;
			for (const _key in style) styleCount++;
			if (styleCount === appliedCount) return style;
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
		return reset ? { ...reset, ...style } : style;

		function resolveStyle(): StyleProps {
			const slot = id ? slots?.get()[id] : undefined;
			let value: StyleProps = slot?.style ?? NO_STYLES;
			// A key the slot stopped setting comes reset to a neutral value (a radius to 0): the
			// boundary rests at its own style's value instead. The transform is composed below.
			const resets = slot?.resetStyleKeys;
			if (resets) {
				const own: Record<string, unknown> = { ...value };
				for (const key in resets) {
					if (key === "transform" || !(key in own)) continue;
					const resting = restingStyleValue(
						key,
						baseLayout as Record<string, unknown>,
					);
					if (resting !== undefined) own[key] = resting;
				}
				value = own as StyleProps;
			}
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

				// Its frame flies in the overlay host, which takes the move; the element keeps its look.
				const look: Record<string, unknown> = {};
				for (const key in value) {
					if (VISUAL_STYLE_KEYS[key])
						look[key] = (value as Record<string, unknown>)[key];
				}
				// The host applies the slot's opacity; the element's own would apply a second time.
				if (typeof value.opacity === "number") look.opacity = 1;
				return {
					...look,
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
