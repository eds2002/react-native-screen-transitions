import { StyleSheet } from "react-native";

/** Styles that place a view among its siblings (its box), as opposed to how it draws inside it. */
const OUTER_LAYOUT_KEYS = new Set([
	"margin",
	"marginTop",
	"marginRight",
	"marginBottom",
	"marginLeft",
	"marginStart",
	"marginEnd",
	"marginHorizontal",
	"marginVertical",
	"marginBlock",
	"marginBlockStart",
	"marginBlockEnd",
	"marginInline",
	"marginInlineStart",
	"marginInlineEnd",
	"position",
	"top",
	"right",
	"bottom",
	"left",
	"start",
	"end",
	"inset",
	"insetBlock",
	"insetBlockStart",
	"insetBlockEnd",
	"insetInline",
	"insetInlineStart",
	"insetInlineEnd",
	"flex",
	"flexGrow",
	"flexShrink",
	"flexBasis",
	"alignSelf",
	"width",
	"height",
	"minWidth",
	"maxWidth",
	"minHeight",
	"maxHeight",
	"aspectRatio",
	"display",
]);

export type SplitLayoutStyle = {
	/** The box: what the escape placeholder takes, so measuring it measures the boundary. */
	outer: Record<string, unknown>;
	/** Everything else, plus filling the box. */
	inner: Record<string, unknown>;
};

/**
 * Splits a boundary's style between its escape placeholder and itself. The placeholder holds the
 * boundary's slot and is what gets measured, so it must be exactly the boundary's box: margins,
 * position, flex and size go to it, and the boundary fills it (a placeholder wrapping a boundary with
 * a margin, or with a fixed width in a stretching parent, measured the margin and the stretch too).
 * Sizes moved out become "auto" on the boundary, which is also what a dropped animated size resets to.
 */
export const splitBoundaryLayoutStyle = (style: unknown): SplitLayoutStyle => {
	const flat = (StyleSheet.flatten(style as never) ?? {}) as Record<
		string,
		unknown
	>;
	const outer: Record<string, unknown> = {};
	const inner: Record<string, unknown> = {};
	for (const key in flat) {
		if (OUTER_LAYOUT_KEYS.has(key)) outer[key] = flat[key];
		else inner[key] = flat[key];
	}
	if ("width" in outer) inner.width = "auto";
	if ("height" in outer) inner.height = "auto";
	inner.flexGrow = 1;
	return { outer, inner };
};
