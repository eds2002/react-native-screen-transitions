import { useMemo } from "react";
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
	type BoundaryEscapeState,
	isBoundaryEscaped,
} from "../portal/utils/is-escaped";

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

	return useAnimatedStyle(() => {
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
		return composeSlotStyleWithLocalTransform(
			value,
			local,
			slot?.boundsLocalTransform,
		);
	});
}
