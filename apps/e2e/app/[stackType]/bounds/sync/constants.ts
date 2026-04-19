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

type BoundaryNodeInput = {
	width: number;
	height: number;
	position: BoxPosition;
	boundary: BoundaryConfig;
	description?: string;
};

type BoundaryNode = Omit<BoundaryNodeInput, "description"> & {
	description: string;
};

export type BoundsTestCase = {
	id: string;
	title: string;
	category: string;
	source: BoundaryNode;
	destination: BoundaryNode;
};

type SizePresetName =
	| "tiny"
	| "smallSquare"
	| "mediumSquare"
	| "largeSquare"
	| "tallCard"
	| "wideCard"
	| "heroTall"
	| "heroWide"
	| "veryTall"
	| "veryWide"
	| "nearScreen";

const SIZE_PRESETS: Record<
	SizePresetName,
	Pick<BoundaryNode, "width" | "height">
> = {
	tiny: { width: 8, height: 8 },
	smallSquare: { width: 80, height: 80 },
	mediumSquare: { width: 120, height: 120 },
	largeSquare: { width: 240, height: 240 },
	tallCard: { width: 80, height: 120 },
	wideCard: { width: 240, height: 120 },
	heroTall: { width: 160, height: 280 },
	heroWide: { width: 280, height: 160 },
	veryTall: { width: 48, height: 220 },
	veryWide: { width: 220, height: 48 },
	nearScreen: { width: 320, height: 560 },
};

const node = (
	width: number,
	height: number,
	position: BoxPosition,
	boundary: BoundaryConfig = {},
	description?: string,
): BoundaryNodeInput => ({
	width,
	height,
	position,
	boundary,
	description,
});

const presetNode = (
	preset: SizePresetName,
	position: BoxPosition,
	boundary: BoundaryConfig = {},
	description?: string,
): BoundaryNodeInput => {
	const { width, height } = SIZE_PRESETS[preset];
	return node(width, height, position, boundary, description);
};

type BoundaryRole = "source" | "destination";

type ResolvedBoundaryConfig = {
	method: NonNullable<BoundaryConfig["method"]>;
	anchor: NonNullable<BoundaryConfig["anchor"]>;
	scaleMode: NonNullable<BoundaryConfig["scaleMode"]>;
	target: NonNullable<BoundaryConfig["target"]>;
};

const resolveBoundaryConfig = (
	boundary: BoundaryConfig,
): ResolvedBoundaryConfig => ({
	method: boundary.method ?? "transform",
	anchor: boundary.anchor ?? "center",
	scaleMode: boundary.scaleMode ?? "match",
	target: boundary.target ?? "bound",
});

const ANCHOR_LABELS: Record<BoxPosition, string> = {
	topLeading: "top-leading point",
	top: "top-center point",
	topTrailing: "top-trailing point",
	leading: "leading-center point",
	center: "center point",
	trailing: "trailing-center point",
	bottomLeading: "bottom-leading point",
	bottom: "bottom-center point",
	bottomTrailing: "bottom-trailing point",
};

const describeMethod = (
	role: BoundaryRole,
	method: ResolvedBoundaryConfig["method"],
) => {
	if (role === "source") {
		switch (method) {
			case "size":
				return "Source moves and resizes toward the target.";
			case "content":
				return "Source defines where destination content should line up.";
			case "transform":
			default:
				return "Source moves and scales toward the target.";
		}
	}

	switch (method) {
		case "size":
			return "Destination resolves from the source with position and size.";
		case "content":
			return "Destination content moves until this box lines up with the source.";
		case "transform":
		default:
			return "Destination resolves from the source with translation and scale.";
	}
};

const describeTarget = (
	role: BoundaryRole,
	target: ResolvedBoundaryConfig["target"],
) => {
	if (target === "bound") {
		return role === "source"
			? "Target is the matching destination box."
			: "Target is this box.";
	}

	if (target === "fullscreen") {
		return role === "source"
			? "Target is fullscreen, so this box expands to the screen."
			: "Target is fullscreen, so the transition resolves against the screen.";
	}

	return `Target is a custom ${target.width}x${target.height} rect at ${target.x},${target.y}.`;
};

const describeScaleMode = (
	scaleMode: ResolvedBoundaryConfig["scaleMode"],
) => {
	switch (scaleMode) {
		case "uniform":
			return "Uniform scale keeps aspect ratio.";
		case "none":
			return "No scaling, only movement.";
		case "match":
		default:
			return "Match scale changes width and height independently.";
	}
};

const describeAnchor = (anchor: ResolvedBoundaryConfig["anchor"]) =>
	`Anchor ${anchor} locks the ${ANCHOR_LABELS[anchor]}.`;

const buildBoundaryDescription = (
	role: BoundaryRole,
	node: BoundaryNodeInput,
) => {
	const config = resolveBoundaryConfig(node.boundary);
	const parts = [describeMethod(role, config.method), describeTarget(role, config.target)];

	if (config.anchor !== "center") {
		parts.push(describeAnchor(config.anchor));
	}

	if (config.scaleMode !== "match") {
		parts.push(describeScaleMode(config.scaleMode));
	}

	return parts.join(" ");
};

const withBoundaryDescription = (
	role: BoundaryRole,
	node: BoundaryNodeInput,
): BoundaryNode => ({
	width: node.width,
	height: node.height,
	position: node.position,
	boundary: node.boundary,
	description: node.description ?? buildBoundaryDescription(role, node),
});

const pair = (
	id: string,
	title: string,
	category: string,
	source: BoundaryNodeInput,
	destination: BoundaryNodeInput,
): BoundsTestCase => ({
	id,
	title,
	category,
	source: withBoundaryDescription("source", source),
	destination: withBoundaryDescription("destination", destination),
});

const fullscreenTarget = (): BoundaryTarget => "fullscreen";

const customRectTarget = ({
	x = 50,
	y = 100,
	width = 200,
	height = 300,
}: {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
} = {}): BoundaryTarget => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

// ─── Methods ─────────────────────────────────────────────────────────────────

const METHOD_CASES: BoundsTestCase[] = [
	pair(
		"transform",
		"Transform",
		"Methods",
		presetNode("smallSquare", "topLeading", { method: "transform" }),
		presetNode("largeSquare", "center", { method: "transform" }),
	),
	pair(
		"size",
		"Size",
		"Methods",
		presetNode("smallSquare", "topLeading", { method: "size" }),
		presetNode("largeSquare", "center", { method: "size" }),
	),
	pair(
		"content",
		"Content (Screen-level)",
		"Methods",
		presetNode("smallSquare", "topLeading", { method: "transform" }),
		presetNode("largeSquare", "center", { method: "content" }),
	),
	pair(
		"transform-to-size",
		"Transform -> Size",
		"Methods",
		presetNode("smallSquare", "topLeading", { method: "transform" }),
		presetNode("heroTall", "center", { method: "size" }),
	),
	pair(
		"size-to-transform",
		"Size -> Transform",
		"Methods",
		presetNode("tallCard", "topLeading", { method: "size" }),
		presetNode("heroWide", "center", { method: "transform" }),
	),
];

// ─── Content ─────────────────────────────────────────────────────────────────

const CONTENT_CASES: BoundsTestCase[] = [
	pair(
		"content-asymmetric",
		"Transform -> Content | Asymmetric",
		"Content",
		presetNode("tallCard", "topLeading", { method: "transform" }),
		presetNode("heroTall", "bottomTrailing", { method: "content" }),
	),
	pair(
		"content-anchor-top",
		"Transform -> Content | Top Anchor",
		"Content",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			anchor: "top",
			scaleMode: "uniform",
		}),
		presetNode("heroWide", "center", {
			method: "content",
			anchor: "top",
			scaleMode: "uniform",
		}),
	),
	pair(
		"content-anchor-bottom-trailing",
		"Transform -> Content | Bottom Trailing",
		"Content",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			anchor: "bottomTrailing",
			scaleMode: "uniform",
		}),
		presetNode("heroTall", "bottomTrailing", {
			method: "content",
			anchor: "bottomTrailing",
			scaleMode: "uniform",
		}),
	),
	pair(
		"content-scale-match",
		"Transform -> Content | Match",
		"Content",
		presetNode("tallCard", "leading", {
			method: "transform",
			scaleMode: "match",
		}),
		presetNode("wideCard", "trailing", {
			method: "content",
			scaleMode: "match",
		}),
	),
	pair(
		"content-scale-none",
		"Transform -> Content | None",
		"Content",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			scaleMode: "none",
			anchor: "center",
		}),
		presetNode("largeSquare", "bottomTrailing", {
			method: "content",
			scaleMode: "none",
			anchor: "center",
		}),
	),
	pair(
		"content-fullscreen",
		"Transform -> Content | Fullscreen Target",
		"Content",
		presetNode("smallSquare", "center", {
			method: "transform",
			target: fullscreenTarget(),
		}),
		presetNode("largeSquare", "center", {
			method: "content",
			target: fullscreenTarget(),
		}),
	),
	pair(
		"content-custom",
		"Transform -> Content | Custom Target",
		"Content",
		presetNode("smallSquare", "center", {
			method: "transform",
			target: customRectTarget(),
		}),
		presetNode("largeSquare", "center", {
			method: "content",
			target: customRectTarget(),
		}),
	),
	pair(
		"size-to-content-fullscreen",
		"Size -> Content | Fullscreen Target",
		"Content",
		presetNode("smallSquare", "center", {
			method: "size",
			target: fullscreenTarget(),
		}),
		presetNode("largeSquare", "center", {
			method: "content",
			target: fullscreenTarget(),
		}),
	),
];

// ─── Scale Modes ─────────────────────────────────────────────────────────────

const SCALE_MODE_CASES: BoundsTestCase[] = [
	pair(
		"scale-match",
		"Match (independent axes)",
		"Scale Modes",
		presetNode("tallCard", "topLeading", {
			method: "transform",
			scaleMode: "match",
		}),
		presetNode("wideCard", "center", {
			method: "transform",
			scaleMode: "match",
		}),
	),
	pair(
		"scale-uniform",
		"Uniform (preserve ratio)",
		"Scale Modes",
		presetNode("tallCard", "topLeading", {
			method: "transform",
			scaleMode: "uniform",
		}),
		presetNode("wideCard", "center", {
			method: "transform",
			scaleMode: "uniform",
		}),
	),
	pair(
		"scale-none",
		"None (translate only)",
		"Scale Modes",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			scaleMode: "none",
		}),
		presetNode("largeSquare", "center", {
			method: "transform",
			scaleMode: "none",
		}),
	),
	pair(
		"scale-match-extreme",
		"Match (landscape -> portrait)",
		"Scale Modes",
		presetNode("veryWide", "leading", {
			method: "transform",
			scaleMode: "match",
		}),
		presetNode("veryTall", "trailing", {
			method: "transform",
			scaleMode: "match",
		}),
	),
	pair(
		"scale-none-long-travel",
		"None (long travel)",
		"Scale Modes",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			scaleMode: "none",
		}),
		presetNode("heroTall", "bottomTrailing", {
			method: "transform",
			scaleMode: "none",
		}),
	),
];

// ─── Anchors ─────────────────────────────────────────────────────────────────

const ANCHOR_CASES: BoundsTestCase[] = [
	pair(
		"anchor-center",
		"Center",
		"Anchors",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			anchor: "center",
			scaleMode: "none",
		}),
		presetNode("largeSquare", "topLeading", {
			method: "transform",
			anchor: "center",
			scaleMode: "none",
		}),
	),
	pair(
		"anchor-asymmetric-trailing",
		"Asymmetric Trailing",
		"Anchors",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			anchor: "topTrailing",
			scaleMode: "none",
		}),
		presetNode("largeSquare", "topLeading", {
			method: "transform",
			anchor: "bottomTrailing",
			scaleMode: "none",
		}),
	),
	pair(
		"anchor-top-leading",
		"Top Leading",
		"Anchors",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			anchor: "topLeading",
			scaleMode: "none",
		}),
		presetNode("largeSquare", "bottomTrailing", {
			method: "transform",
			anchor: "topLeading",
			scaleMode: "none",
		}),
	),
	pair(
		"anchor-bottom",
		"Bottom",
		"Anchors",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			anchor: "bottom",
			scaleMode: "none",
		}),
		presetNode("largeSquare", "bottomTrailing", {
			method: "transform",
			anchor: "bottom",
			scaleMode: "none",
		}),
	),
	pair(
		"anchor-bottom-trailing",
		"Bottom Trailing",
		"Anchors",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			anchor: "bottomTrailing",
			scaleMode: "none",
		}),
		presetNode("largeSquare", "bottomTrailing", {
			method: "transform",
			anchor: "bottomTrailing",
			scaleMode: "none",
		}),
	),
	pair(
		"anchor-leading-trailing",
		"Leading -> Trailing",
		"Anchors",
		presetNode("tallCard", "leading", {
			method: "transform",
			anchor: "leading",
			scaleMode: "none",
		}),
		presetNode("heroTall", "trailing", {
			method: "transform",
			anchor: "trailing",
			scaleMode: "none",
		}),
	),
	pair(
		"anchor-center-to-bottom-leading",
		"Center -> Bottom Leading",
		"Anchors",
		presetNode("smallSquare", "center", {
			method: "transform",
			anchor: "center",
			scaleMode: "none",
		}),
		presetNode("heroWide", "bottomLeading", {
			method: "transform",
			anchor: "bottomLeading",
			scaleMode: "none",
		}),
	),
];

// ─── Targets ─────────────────────────────────────────────────────────────────

const TARGET_CASES: BoundsTestCase[] = [
	pair(
		"target-bound",
		"Bound (element to element)",
		"Targets",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			target: "bound",
		}),
		presetNode("largeSquare", "center", {
			method: "transform",
			target: "bound",
		}),
	),
	pair(
		"target-fullscreen",
		"Fullscreen",
		"Targets",
		presetNode("smallSquare", "center", {
			method: "transform",
			target: fullscreenTarget(),
		}),
		presetNode("largeSquare", "center", {
			method: "transform",
			target: fullscreenTarget(),
		}),
	),
	pair(
		"target-custom",
		"Custom Rect (200x300 @ 50,100)",
		"Targets",
		presetNode("smallSquare", "center", {
			method: "transform",
			target: customRectTarget(),
		}),
		presetNode("largeSquare", "center", {
			method: "transform",
			target: customRectTarget(),
		}),
	),
	pair(
		"target-size-fullscreen",
		"Size + Fullscreen",
		"Targets",
		presetNode("smallSquare", "center", {
			method: "size",
			target: fullscreenTarget(),
		}),
		presetNode("largeSquare", "center", {
			method: "size",
			target: fullscreenTarget(),
		}),
	),
	pair(
		"target-size-custom",
		"Size + Custom Rect",
		"Targets",
		presetNode("smallSquare", "center", {
			method: "size",
			target: customRectTarget({ x: 24, y: 180, width: 300, height: 140 }),
		}),
		presetNode("largeSquare", "center", {
			method: "size",
			target: customRectTarget({ x: 24, y: 180, width: 300, height: 140 }),
		}),
	),
];

// ─── Mixed Config ────────────────────────────────────────────────────────────

const MIXED_CONFIG_CASES: BoundsTestCase[] = [
	pair(
		"mixed-transform-size-top",
		"Transform -> Size | Top Anchor",
		"Mixed Config",
		presetNode("smallSquare", "topLeading", {
			method: "transform",
			anchor: "top",
			scaleMode: "none",
		}),
		presetNode("heroWide", "center", {
			method: "size",
			anchor: "top",
			scaleMode: "none",
		}),
	),
	pair(
		"mixed-transform-content-fullscreen",
		"Transform -> Content | Fullscreen",
		"Mixed Config",
		presetNode("smallSquare", "center", {
			method: "transform",
			target: fullscreenTarget(),
			anchor: "top",
			scaleMode: "uniform",
		}),
		presetNode("largeSquare", "center", {
			method: "content",
			target: fullscreenTarget(),
			anchor: "top",
			scaleMode: "uniform",
		}),
	),
	pair(
		"mixed-anchor-swap",
		"Transform | Anchor Swap",
		"Mixed Config",
		presetNode("tallCard", "topLeading", {
			method: "transform",
			anchor: "topLeading",
			scaleMode: "none",
		}),
		presetNode("heroTall", "bottomTrailing", {
			method: "transform",
			anchor: "bottomTrailing",
			scaleMode: "none",
		}),
	),
	pair(
		"mixed-scale-swap",
		"Transform | Match -> None",
		"Mixed Config",
		presetNode("tallCard", "leading", {
			method: "transform",
			scaleMode: "match",
		}),
		presetNode("wideCard", "trailing", {
			method: "transform",
			scaleMode: "none",
		}),
	),
];

// ─── Edge Cases ──────────────────────────────────────────────────────────────

const EDGE_CASES: BoundsTestCase[] = [
	pair(
		"edge-identical",
		"Identical Bounds (no-op)",
		"Edge Cases",
		presetNode("mediumSquare", "center", { method: "transform" }),
		presetNode("mediumSquare", "center", { method: "transform" }),
	),
	pair(
		"edge-extreme-aspect",
		"Extreme Aspect Ratio",
		"Edge Cases",
		node(40, 200, "leading", {
			method: "transform",
			scaleMode: "match",
		}),
		node(300, 40, "trailing", {
			method: "transform",
			scaleMode: "match",
		}),
	),
	pair(
		"edge-near-zero",
		"Near-Zero Source (8x8)",
		"Edge Cases",
		presetNode("tiny", "topLeading", { method: "transform" }),
		node(300, 300, "center", { method: "transform" }),
	),
	pair(
		"edge-very-tall-to-square",
		"Very Tall -> Medium Square",
		"Edge Cases",
		presetNode("veryTall", "leading", {
			method: "transform",
			scaleMode: "match",
		}),
		presetNode("mediumSquare", "center", {
			method: "transform",
			scaleMode: "match",
		}),
	),
	pair(
		"edge-very-wide-to-square",
		"Very Wide -> Medium Square",
		"Edge Cases",
		presetNode("veryWide", "top", {
			method: "transform",
			scaleMode: "match",
		}),
		presetNode("mediumSquare", "center", {
			method: "transform",
			scaleMode: "match",
		}),
	),
	pair(
		"edge-large-to-tiny-close",
		"Large -> Tiny Close",
		"Edge Cases",
		presetNode("largeSquare", "center", { method: "transform" }),
		presetNode("tiny", "center", { method: "transform" }),
	),
	pair(
		"edge-corner-swap-tiny-to-large",
		"Tiny Corner Swap",
		"Edge Cases",
		node(12, 12, "bottomTrailing", { method: "transform" }),
		node(280, 280, "topLeading", { method: "transform" }),
	),
	pair(
		"edge-near-screen-to-medium",
		"Near-Screen -> Medium",
		"Edge Cases",
		presetNode("nearScreen", "center", {
			method: "transform",
			scaleMode: "uniform",
		}),
		presetNode("mediumSquare", "center", {
			method: "transform",
			scaleMode: "uniform",
		}),
	),
];

// ─── All Cases ───────────────────────────────────────────────────────────────

export const ALL_CASES: BoundsTestCase[] = [
	...METHOD_CASES,
	...CONTENT_CASES,
	...SCALE_MODE_CASES,
	...ANCHOR_CASES,
	...TARGET_CASES,
	...MIXED_CONFIG_CASES,
	...EDGE_CASES,
];

export const CATEGORIES = [
	{ title: "Methods", cases: METHOD_CASES },
	{ title: "Content", cases: CONTENT_CASES },
	{ title: "Scale Modes", cases: SCALE_MODE_CASES },
	{ title: "Anchors", cases: ANCHOR_CASES },
	{ title: "Targets", cases: TARGET_CASES },
	{ title: "Mixed Config", cases: MIXED_CONFIG_CASES },
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
