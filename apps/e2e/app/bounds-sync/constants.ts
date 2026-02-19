import { makeMutable } from "react-native-reanimated";

export type BoxPosition =
	| "topLeading"
	| "top"
	| "topTrailing"
	| "leading"
	| "center"
	| "trailing"
	| "bottomLeading"
	| "bottom"
	| "bottomTrailing";

type BoundaryTarget =
	| "bound"
	| "fullscreen"
	| {
			x: number;
			y: number;
			pageX: number;
			pageY: number;
			width: number;
			height: number;
	  };

export type BoundaryConfig = {
	method?: "transform" | "size" | "content";
	anchor?: BoxPosition;
	scaleMode?: "match" | "uniform" | "none";
	target?: BoundaryTarget;
};

type BoundaryNode = {
	width: number;
	height: number;
	position: BoxPosition;
	boundary: BoundaryConfig;
};

export type BoundsTestCase = {
	id: string;
	title: string;
	category: string;
	source: BoundaryNode;
	destination: BoundaryNode;
};

// ─── Methods ─────────────────────────────────────────────────────────────────

const METHOD_CASES: BoundsTestCase[] = [
	{
		id: "transform",
		title: "Transform",
		category: "Methods",
		source: {
			width: 80,
			height: 80,
			position: "topLeading",
			boundary: { method: "transform" },
		},
		destination: {
			width: 240,
			height: 240,
			position: "center",
			boundary: { method: "transform" },
		},
	},
	{
		id: "size",
		title: "Size",
		category: "Methods",
		source: {
			width: 80,
			height: 80,
			position: "topLeading",
			boundary: { method: "size" },
		},
		destination: {
			width: 240,
			height: 240,
			position: "center",
			boundary: { method: "size" },
		},
	},
	{
		id: "content",
		title: "Content (Screen-level)",
		category: "Methods",
		source: {
			width: 80,
			height: 80,
			position: "topLeading",
			boundary: { method: "transform" },
		},
		destination: {
			width: 240,
			height: 240,
			position: "center",
			boundary: { method: "content" },
		},
	},
];

// ─── Scale Modes ─────────────────────────────────────────────────────────────

const SCALE_MODE_CASES: BoundsTestCase[] = [
	{
		id: "scale-match",
		title: "Match (independent axes)",
		category: "Scale Modes",
		source: {
			width: 80,
			height: 120,
			position: "topLeading",
			boundary: { method: "transform", scaleMode: "match" },
		},
		destination: {
			width: 240,
			height: 120,
			position: "center",
			boundary: { method: "transform", scaleMode: "match" },
		},
	},
	{
		id: "scale-uniform",
		title: "Uniform (preserve ratio)",
		category: "Scale Modes",
		source: {
			width: 80,
			height: 120,
			position: "topLeading",
			boundary: {
				method: "transform",
				scaleMode: "uniform",
			},
		},
		destination: {
			width: 240,
			height: 120,
			position: "center",
			boundary: {
				method: "transform",
				scaleMode: "uniform",
			},
		},
	},
	{
		id: "scale-none",
		title: "None (translate only)",
		category: "Scale Modes",
		source: {
			width: 80,
			height: 80,
			position: "topLeading",
			boundary: { method: "transform", scaleMode: "none" },
		},
		destination: {
			width: 240,
			height: 240,
			position: "center",
			boundary: { method: "transform", scaleMode: "none" },
		},
	},
];

// ─── Anchors ─────────────────────────────────────────────────────────────────

const ANCHOR_CASES: BoundsTestCase[] = [
	{
		id: "anchor-center",
		title: "Center",
		category: "Anchors",
		source: {
			width: 80,
			height: 80,
			position: "topLeading",
			boundary: {
				method: "transform",
				anchor: "center",
				scaleMode: "none",
			},
		},
		destination: {
			width: 240,
			height: 240,
			position: "bottomTrailing",
			boundary: {
				method: "transform",
				anchor: "center",
				scaleMode: "none",
			},
		},
	},
	{
		id: "anchor-top-leading",
		title: "Top Leading",
		category: "Anchors",
		source: {
			width: 80,
			height: 80,
			position: "topLeading",
			boundary: {
				method: "transform",
				anchor: "topLeading",
				scaleMode: "none",
			},
		},
		destination: {
			width: 240,
			height: 240,
			position: "bottomTrailing",
			boundary: {
				method: "transform",
				anchor: "topLeading",
				scaleMode: "none",
			},
		},
	},
	{
		id: "anchor-bottom",
		title: "Bottom",
		category: "Anchors",
		source: {
			width: 80,
			height: 80,
			position: "topLeading",
			boundary: {
				method: "transform",
				anchor: "bottom",
				scaleMode: "none",
			},
		},
		destination: {
			width: 240,
			height: 240,
			position: "bottomTrailing",
			boundary: {
				method: "transform",
				anchor: "bottom",
				scaleMode: "none",
			},
		},
	},
	{
		id: "anchor-bottom-trailing",
		title: "Bottom Trailing",
		category: "Anchors",
		source: {
			width: 80,
			height: 80,
			position: "topLeading",
			boundary: {
				method: "transform",
				anchor: "bottomTrailing",
				scaleMode: "none",
			},
		},
		destination: {
			width: 240,
			height: 240,
			position: "bottomTrailing",
			boundary: {
				method: "transform",
				anchor: "bottomTrailing",
				scaleMode: "none",
			},
		},
	},
];

// ─── Targets ─────────────────────────────────────────────────────────────────

const TARGET_CASES: BoundsTestCase[] = [
	{
		id: "target-bound",
		title: "Bound (element to element)",
		category: "Targets",
		source: {
			width: 80,
			height: 80,
			position: "topLeading",
			boundary: { method: "transform", target: "bound" },
		},
		destination: {
			width: 240,
			height: 240,
			position: "center",
			boundary: { method: "transform", target: "bound" },
		},
	},
	{
		id: "target-fullscreen",
		title: "Fullscreen",
		category: "Targets",
		source: {
			width: 80,
			height: 80,
			position: "center",
			boundary: {
				method: "transform",
				target: "fullscreen",
			},
		},
		destination: {
			width: 240,
			height: 240,
			position: "center",
			boundary: {
				method: "transform",
				target: "fullscreen",
			},
		},
	},
	{
		id: "target-custom",
		title: "Custom Rect (200x300 @ 50,100)",
		category: "Targets",
		source: {
			width: 80,
			height: 80,
			position: "center",
			boundary: {
				method: "transform",
				target: {
					x: 50,
					y: 100,
					pageX: 50,
					pageY: 100,
					width: 200,
					height: 300,
				},
			},
		},
		destination: {
			width: 240,
			height: 240,
			position: "center",
			boundary: {
				method: "transform",
				target: {
					x: 50,
					y: 100,
					pageX: 50,
					pageY: 100,
					width: 200,
					height: 300,
				},
			},
		},
	},
];

// ─── Edge Cases ──────────────────────────────────────────────────────────────

const EDGE_CASES: BoundsTestCase[] = [
	{
		id: "edge-identical",
		title: "Identical Bounds (no-op)",
		category: "Edge Cases",
		source: {
			width: 120,
			height: 120,
			position: "center",
			boundary: { method: "transform" },
		},
		destination: {
			width: 120,
			height: 120,
			position: "center",
			boundary: { method: "transform" },
		},
	},
	{
		id: "edge-extreme-aspect",
		title: "Extreme Aspect Ratio",
		category: "Edge Cases",
		source: {
			width: 40,
			height: 200,
			position: "leading",
			boundary: { method: "transform", scaleMode: "match" },
		},
		destination: {
			width: 300,
			height: 40,
			position: "trailing",
			boundary: { method: "transform", scaleMode: "match" },
		},
	},
	{
		id: "edge-near-zero",
		title: "Near-Zero Source (8x8)",
		category: "Edge Cases",
		source: {
			width: 8,
			height: 8,
			position: "topLeading",
			boundary: { method: "transform" },
		},
		destination: {
			width: 300,
			height: 300,
			position: "center",
			boundary: { method: "transform" },
		},
	},
];

// ─── All Cases ───────────────────────────────────────────────────────────────

export const ALL_CASES: BoundsTestCase[] = [
	...METHOD_CASES,
	...SCALE_MODE_CASES,
	...ANCHOR_CASES,
	...TARGET_CASES,
	...EDGE_CASES,
];

export const CATEGORIES = [
	{ title: "Methods", cases: METHOD_CASES },
	{ title: "Scale Modes", cases: SCALE_MODE_CASES },
	{ title: "Anchors", cases: ANCHOR_CASES },
	{ title: "Targets", cases: TARGET_CASES },
	{ title: "Edge Cases", cases: EDGE_CASES },
];

export const BOUNDARY_TAG = "bounds-sync-element";

/**
 * Module-level mutable shared value tracking the active test case ID.
 * Read by the layout interpolator on the UI thread.
 */
export const activeCaseId = makeMutable(ALL_CASES[0].id);

/**
 * Returns the active test case config (JS thread only — for screen rendering).
 */
export const getCaseById = (id: string): BoundsTestCase | undefined =>
	ALL_CASES.find((c) => c.id === id);

/**
 * Computes absolute positioning style for a box at a named position
 * within a container of the given dimensions.
 */
export const getBoxPositionStyle = (
	position: BoxPosition,
	boxWidth: number,
	boxHeight: number,
	containerWidth: number,
	containerHeight: number,
) => {
	const MARGIN = 32;

	switch (position) {
		case "topLeading":
			return { top: MARGIN, left: MARGIN };
		case "top":
			return { top: MARGIN, left: (containerWidth - boxWidth) / 2 };
		case "topTrailing":
			return { top: MARGIN, right: MARGIN };
		case "leading":
			return { top: (containerHeight - boxHeight) / 2, left: MARGIN };
		case "center":
			return {
				top: (containerHeight - boxHeight) / 2,
				left: (containerWidth - boxWidth) / 2,
			};
		case "trailing":
			return { top: (containerHeight - boxHeight) / 2, right: MARGIN };
		case "bottomLeading":
			return { bottom: MARGIN, left: MARGIN };
		case "bottom":
			return { bottom: MARGIN, left: (containerWidth - boxWidth) / 2 };
		case "bottomTrailing":
			return { bottom: MARGIN, right: MARGIN };
	}
};
