import { useRef, useState } from "react";
import { type LayoutChangeEvent, StyleSheet } from "react-native";

type Size = { width: number; height: number };
type SizedAxes = { width: boolean; height: boolean };

/**
 * Which axes the placeholder's own style already sizes. Those need no pin, and must not get one:
 * a layout size is rounded to the pixel grid, so a 171.5 pt card is laid out 171.67 pt wide on a 3x
 * screen, and pinning that makes two such cards and their gap overflow a row that fits them exactly.
 */
export const resolveSizedAxes = (style: unknown): SizedAxes => {
	const flat = (StyleSheet.flatten(style as never) ?? {}) as Record<
		string,
		unknown
	>;
	const set = (key: string) => flat[key] !== undefined && flat[key] !== "auto";
	// An absolutely placed box with both insets on an axis is sized by them (absoluteFill): a pin
	// would freeze it at its first size when its parent resizes it later.
	const absolute = flat.position === "absolute";
	const either = (a: string, b: string) => set(a) || set(b);
	const horizontal =
		set("insetInline") ||
		((either("left", "start") || set("insetInlineStart")) &&
			(either("right", "end") || set("insetInlineEnd")));
	const vertical =
		set("insetBlock") ||
		((set("top") || set("insetBlockStart")) &&
			(set("bottom") || set("insetBlockEnd")));
	const width = set("width") || (absolute && (set("inset") || horizontal));
	const height = set("height") || (absolute && (set("inset") || vertical));
	// An aspect ratio derives the other axis from the one that is set.
	const ratio = flat.aspectRatio !== undefined && (width || height);
	return { width: width || ratio, height: height || ratio };
};

/**
 * The placeholder keeps the boundary's slot while its frame is in the overlay. An axis the boundary's
 * style sizes keeps that size; any other axis came from the boundary's content, which leaves with the
 * frame, so it is pinned to the boundary's own layout (not a measurement, which a scaled screen would
 * shrink), kept on the JS side without a UI-thread hop, and only once the boundary is measured for a
 * transition: that render lands before its overlay host exists, so before the frame can leave.
 * Boundaries that never transition pay one cheap layout callback.
 */
export const usePlaceholderStyles = (pinned: boolean, sized: SizedAxes) => {
	const layout = useRef<Size | null>(null);
	const [pinnedSize, setPinnedSize] = useState<Size | null>(null);
	const needsPin = !sized.width || !sized.height;

	if (needsPin && pinned && !pinnedSize && layout.current) {
		setPinnedSize(layout.current);
	}

	const handleOnLayout = ({ nativeEvent }: LayoutChangeEvent) => {
		const { width, height } = nativeEvent.layout;
		if (width === 0 || height === 0) return;
		layout.current = { width, height };
		if (needsPin && pinned && !pinnedSize) setPinnedSize(layout.current);
	};

	const placeholderStyle =
		needsPin && pinnedSize
			? {
					...(sized.width ? null : { width: pinnedSize.width }),
					...(sized.height ? null : { height: pinnedSize.height }),
				}
			: undefined;

	return { placeholderStyle, handleOnLayout };
};
