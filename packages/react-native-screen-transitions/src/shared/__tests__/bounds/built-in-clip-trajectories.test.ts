import { beforeEach, describe, expect, it } from "bun:test";
import type { SmoothClipPresentation } from "react-native-smooth-clip-view";
import { NAVIGATION_MASK_ELEMENT_STYLE_ID } from "../../constants";
import { BoundStore } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import { adaptBuiltInClipSlot } from "../../utils/bounds/navigation/clip/adapter";
import { projectCenteredAperture } from "../../utils/bounds/navigation/clip/projector";
import { getBuiltInClipRuntimeMarker } from "../../utils/bounds/navigation/clip/runtime-metadata";
import { buildRevealStyles } from "../../utils/bounds/navigation/reveal/build";
import { REVEAL_CLIP_NATIVE_PLAN } from "../../utils/bounds/navigation/reveal/native-plan";
import { buildZoomStyles } from "../../utils/bounds/navigation/zoom/build";
import { ZOOM_CLIP_NATIVE_PLAN } from "../../utils/bounds/navigation/zoom/native-plan";

const SCREEN_LAYOUT = { width: 390, height: 844 };
const PAIR_KEY = createScreenPairKey("screen-a", "screen-b");
const SOURCE_BOUNDS = {
	x: 155,
	y: 100,
	pageX: 155,
	pageY: 100,
	width: 80,
	height: 80,
};
const DESTINATION_BOUNDS = {
	x: 95,
	y: 322,
	pageX: 95,
	pageY: 322,
	width: 200,
	height: 200,
};

type LegacyGeometry = Readonly<{
	width: number;
	height: number;
	translateX: number;
	translateY: number;
	scale: number;
	radius: number;
}>;

type TrajectoryFrame = Readonly<{
	name: string;
	progress: number;
	closing: boolean;
	gesture: "idle" | "drag";
	content: LegacyGeometry;
	mask: LegacyGeometry;
}>;

const ZOOM_FRAMES: readonly TrajectoryFrame[] = [
	{
		name: "open start",
		progress: 0,
		closing: false,
		gesture: "idle",
		content: {
			width: 390,
			height: 844,
			translateX: 0,
			translateY: -282,
			scale: 0.4,
			radius: 14,
		},
		mask: {
			width: 80,
			height: 80,
			translateX: 155,
			translateY: 382,
			scale: 2.5,
			radius: 14,
		},
	},
	{
		name: "open midpoint",
		progress: 0.5,
		closing: false,
		gesture: "idle",
		content: {
			width: 390,
			height: 844,
			translateX: 0,
			translateY: -141,
			scale: 0.7,
			radius: 39,
		},
		mask: {
			width: 235,
			height: 462,
			translateX: 77.5,
			translateY: 191,
			scale: 1.4285714285714286,
			radius: 39,
		},
	},
	{
		name: "open end",
		progress: 1,
		closing: false,
		gesture: "idle",
		content: {
			width: 390,
			height: 844,
			translateX: 0,
			translateY: 0,
			scale: 1,
			radius: 64,
		},
		mask: {
			width: 390,
			height: 844,
			translateX: 0,
			translateY: 0,
			scale: 1,
			radius: 64,
		},
	},
	{
		name: "close midpoint",
		progress: 0.5,
		closing: true,
		gesture: "idle",
		content: {
			width: 390,
			height: 844,
			translateX: 0,
			translateY: -141,
			scale: 0.7,
			radius: 39,
		},
		mask: {
			width: 235,
			height: 462,
			translateX: 77.5,
			translateY: 191,
			scale: 1.4285714285714286,
			radius: 39,
		},
	},
	{
		name: "live vertical gesture",
		progress: 1,
		closing: false,
		gesture: "drag",
		content: {
			width: 390,
			height: 844,
			translateX: 0,
			translateY: 142.17922840448247,
			scale: 0.8054835854398791,
			radius: 64,
		},
		mask: {
			width: 390,
			height: 662.4,
			translateX: 0,
			translateY: 0,
			scale: 1,
			radius: 64,
		},
	},
];

const REVEAL_FRAMES: readonly TrajectoryFrame[] = [
	{
		name: "open start",
		progress: 0,
		closing: false,
		gesture: "idle",
		content: { ...ZOOM_FRAMES[0]!.content, radius: 0 },
		mask: ZOOM_FRAMES[0]!.mask,
	},
	{
		name: "open midpoint",
		progress: 0.5,
		closing: false,
		gesture: "idle",
		content: { ...ZOOM_FRAMES[1]!.content, radius: 0 },
		mask: { ...ZOOM_FRAMES[1]!.mask, radius: 36 },
	},
	{
		name: "open end",
		progress: 1,
		closing: false,
		gesture: "idle",
		content: { ...ZOOM_FRAMES[2]!.content, radius: 0 },
		mask: { ...ZOOM_FRAMES[2]!.mask, radius: 58 },
	},
	{
		name: "close midpoint",
		progress: 0.5,
		closing: true,
		gesture: "idle",
		content: { ...ZOOM_FRAMES[1]!.content, radius: 0 },
		mask: {
			width: 223.25,
			height: 438.9,
			translateX: 83.375,
			translateY: 202.55,
			scale: 1.4285714285714286,
			radius: 36,
		},
	},
	{
		name: "live vertical gesture",
		progress: 1,
		closing: false,
		gesture: "drag",
		content: {
			width: 390,
			height: 844,
			translateX: 0,
			translateY: 220,
			scale: 0.54390625,
			radius: 0,
		},
		mask: {
			width: 390,
			height: 617,
			translateX: 0,
			translateY: 0,
			scale: 1,
			radius: 58,
		},
	},
];

const createGesture = (kind: "idle" | "drag") => {
	const isDrag = kind === "drag";
	const y = isDrag ? 220 : 0;
	const normY = isDrag ? 0.35 : 0;
	const handoff = {
		x: 0,
		y,
		normX: 0,
		normY,
		velocity: isDrag ? 0.8 : 0,
		scale: 1,
		normScale: 0,
		focalX: 0,
		focalY: 0,
		pinchOriginX: 0,
		pinchOriginY: 0,
		rotation: 0,
		raw: {
			x: 0,
			y,
			normX: 0,
			normY,
			scale: 1,
			normScale: 0,
			rotation: 0,
		},
		active: isDrag ? "vertical" : null,
		direction: isDrag ? "vertical" : null,
	};

	return {
		...handoff,
		handoff,
		dismissing: 0,
		dragging: isDrag ? 1 : 0,
		settling: 0,
		normalizedX: 0,
		normalizedY: normY,
		isDismissing: 0,
		isDragging: isDrag ? 1 : 0,
	};
};

const createFocusedProps = (frame: TrajectoryFrame) =>
	({
		active: {
			transitionProgress: frame.progress,
			gesture: createGesture(frame.gesture),
			animating: true,
			closing: frame.closing,
			entering: !frame.closing,
			settled: false,
		},
		progress: frame.progress,
		transitionProgress: frame.progress,
		layouts: { screen: SCREEN_LAYOUT },
		insets: { top: 0, right: 0, bottom: 34, left: 0 },
		focused: true,
		previous: { route: { key: "screen-a" }, transitionProgress: 1 },
		current: {
			route: { key: "screen-b" },
			transitionProgress: frame.progress,
			options: { navigationMaskEnabled: true },
		},
	}) as any;

const getClip = (slot: unknown): SmoothClipPresentation => {
	const clip = (slot as { clip?: SmoothClipPresentation } | undefined)?.clip;
	if (clip === undefined) throw new Error("Expected a projected clip slot");
	return clip;
};

const expectMatchesLegacyCenteredTransform = (
	presentation: SmoothClipPresentation,
	legacy: LegacyGeometry,
	contentTransform: boolean,
) => {
	const expectedWidth = legacy.width * legacy.scale;
	const expectedHeight = legacy.height * legacy.scale;
	expect(presentation.clip.x).toBeCloseTo(
		legacy.translateX + (legacy.width - expectedWidth) / 2,
		10,
	);
	expect(presentation.clip.y).toBeCloseTo(
		legacy.translateY + (legacy.height - expectedHeight) / 2,
		10,
	);
	expect(presentation.clip.width).toBeCloseTo(expectedWidth, 10);
	expect(presentation.clip.height).toBeCloseTo(expectedHeight, 10);
	expect(presentation.clip.radius).toBeCloseTo(
		legacy.radius * legacy.scale,
		10,
	);
	expect(presentation.contentTranslateX).toBe(
		contentTransform ? legacy.translateX : 0,
	);
	expect(presentation.contentTranslateY).toBe(
		contentTransform ? legacy.translateY : 0,
	);
	expect(presentation.contentScale).toBe(
		contentTransform ? legacy.scale : 1,
	);
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
	BoundStore.link.setSource(
		PAIR_KEY,
		"card",
		"screen-a",
		SOURCE_BOUNDS,
		{ borderRadius: 14 },
	);
	BoundStore.link.setDestination(
		PAIR_KEY,
		"card",
		"screen-b",
		DESTINATION_BOUNDS,
		{ borderRadius: 28 },
	);
});

describe("built-in output-space clip trajectories", () => {
	it("matches zoom's prior open, close, and gesture geometry", () => {
		for (const frame of ZOOM_FRAMES) {
			const result = buildZoomStyles({
				tag: "card",
				props: createFocusedProps(frame),
				zoomOptions: { target: "bound" },
			});
			const content = getClip(result.content);
			const mask = getClip(result[NAVIGATION_MASK_ELEMENT_STYLE_ID]);

			expectMatchesLegacyCenteredTransform(content, frame.content, true);
			expectMatchesLegacyCenteredTransform(mask, frame.mask, false);
			expect(content.clip.curve).toBe("circular");
			expect(mask.clip.curve).toBe("continuous");
			expect(result.content?.style?.transform).toEqual([
				{ rotateZ: "0rad" },
			]);
			expect(result.content?.style).not.toHaveProperty("overflow");
			expect(result.content?.style).not.toHaveProperty("borderRadius");
			expect(
				(result[NAVIGATION_MASK_ELEMENT_STYLE_ID] as any)?.style,
			).toBeUndefined();
		}
	});

	it("matches reveal's prior open, close, and gesture geometry", () => {
		for (const frame of REVEAL_FRAMES) {
			const result = buildRevealStyles({
				tag: "card",
				props: createFocusedProps(frame),
				revealOptions: {},
			});
			const content = getClip(result.content);
			const mask = getClip(result[NAVIGATION_MASK_ELEMENT_STYLE_ID]);

			expectMatchesLegacyCenteredTransform(content, frame.content, true);
			expectMatchesLegacyCenteredTransform(mask, frame.mask, false);
			expect(content.clip.curve).toBe("circular");
			expect(mask.clip.curve).toBe("continuous");
			expect(result.content?.style).not.toHaveProperty("transform");
			expect(result.content?.style).not.toHaveProperty("shadowColor");
			expect(result.content?.style).not.toHaveProperty("shadowOpacity");
			expect(result.content?.style).not.toHaveProperty("shadowRadius");
			expect(result.content?.style).not.toHaveProperty("elevation");
			expect(content.boxShadow).toEqual({
				color: `rgba(0, 0, 0, ${frame.progress * 0.25})`,
				offsetX: 0,
				offsetY: 2 * frame.content.scale,
				blurRadius: 64 * frame.content.scale,
				spreadDistance: 0,
			});
			const marker = getBuiltInClipRuntimeMarker(content);
			expect(marker?.endpoints?.["0"]?.boxShadow?.color).toBe(
				"rgba(0, 0, 0, 0)",
			);
			expect(marker?.endpoints?.["1"]?.boxShadow?.color).toBe(
				"rgba(0, 0, 0, 0.25)",
			);
			expect(
				(result[NAVIGATION_MASK_ELEMENT_STYLE_ID] as any)?.style,
			).toBeUndefined();
		}
	});

	it("keeps zoom's content clip when the nested navigation mask is disabled", () => {
		const frame = ZOOM_FRAMES[1]!;
		const props = createFocusedProps(frame);
		props.current.options.navigationMaskEnabled = false;
		const result = buildZoomStyles({
			tag: "card",
			props,
			zoomOptions: { target: "bound" },
		});

		expectMatchesLegacyCenteredTransform(
			getClip(result.content),
			frame.content,
			true,
		);
		expect(result[NAVIGATION_MASK_ELEMENT_STYLE_ID]).toEqual({});
	});

	it("keeps rotated zoom frames on the visually equivalent legacy RN path", () => {
		const frame = ZOOM_FRAMES[1]!;
		const props = createFocusedProps(frame);
		props.active.gesture.active = "pinch-in";
		props.active.gesture.handoff.active = "pinch-in";
		props.active.gesture.rotation = 0.25;
		props.active.gesture.raw.rotation = 0.25;
		props.active.gesture.handoff.rotation = 0.25;
		props.active.gesture.pinchOriginX = SCREEN_LAYOUT.width / 2;
		props.active.gesture.pinchOriginY = SCREEN_LAYOUT.height / 2;
		props.active.gesture.handoff.pinchOriginX = SCREEN_LAYOUT.width / 2;
		props.active.gesture.handoff.pinchOriginY = SCREEN_LAYOUT.height / 2;

		const result = buildZoomStyles({
			tag: "card",
			props,
			zoomOptions: { target: "bound" },
		});
		const content = result.content as any;

		expect(content.clip).toBeUndefined();
		expect(content.style).toMatchObject({
			borderRadius: frame.content.radius,
			overflow: "hidden",
		});
		expect(content.style.transform).toEqual([
			{ translateX: frame.content.translateX },
			{ translateY: frame.content.translateY },
			{ scale: frame.content.scale },
			{ rotateZ: "0.25rad" },
		]);
		expect(
			ZOOM_CLIP_NATIVE_PLAN.participants.find(
				(participant) => participant.slotId === "content",
			)?.promotionBlockers,
		).toContain("rotation");
	});
});

describe("built-in clip projection contract", () => {
	it("projects and scales each corner without changing content translation", () => {
		const presentation = projectCenteredAperture({
			aperture: {
				x: 4,
				y: 8,
				width: 100,
				height: 60,
				radius: 2,
				topLeftRadius: 4,
				topRightRadius: 6,
				bottomRightRadius: 8,
				bottomLeftRadius: 10,
				curve: "continuous",
			},
			apertureTranslateX: 12,
			apertureTranslateY: -4,
			apertureScale: 0.5,
			contentTranslateX: 7,
			contentTranslateY: 9,
			contentScale: 0.75,
		});

		expect(presentation).toEqual({
			clip: {
				x: 41,
				y: 19,
				width: 50,
				height: 30,
				radius: 1,
				topLeftRadius: 2,
				topRightRadius: 3,
				bottomRightRadius: 4,
				bottomLeftRadius: 5,
				curve: "continuous",
			},
			contentTranslateX: 7,
			contentTranslateY: 9,
			contentScale: 0.75,
		});
	});

	it("prefers an explicit whole-object clip and falls back atomically", () => {
		const projected = projectCenteredAperture({
			aperture: {
				x: 0,
				y: 0,
				width: 10,
				height: 10,
				radius: 1,
				curve: "circular",
			},
			apertureTranslateX: 0,
			apertureTranslateY: 0,
			apertureScale: 1,
			contentTranslateX: 0,
			contentTranslateY: 0,
			contentScale: 1,
		})!;
		const explicit = {
			...projected,
			clip: { ...projected.clip, radius: 7 },
		};
		const legacyStyle = { overflow: "hidden" as const, borderRadius: 1 };
		const explicitSlot = adaptBuiltInClipSlot({
			projectedClip: projected,
			explicitClip: explicit,
			residualStyle: { opacity: 0.5 },
			legacyStyle,
		}) as any;
		const fallbackSlot = adaptBuiltInClipSlot({
			projectedClip: null,
			residualStyle: { opacity: 0.5 },
			legacyStyle,
		}) as any;

		expect(explicitSlot.clip).toBe(explicit);
		expect(explicitSlot.clip.clip.radius).toBe(7);
		expect(fallbackSlot).toEqual({ style: legacyStyle });
	});

	it("publishes recursively immutable promotion metadata", () => {
		for (const plan of [ZOOM_CLIP_NATIVE_PLAN, REVEAL_CLIP_NATIVE_PLAN]) {
			expect(plan.trusted).toBe(true);
			expect(plan.projectionSpace).toBe("output");
			expect(Object.isFrozen(plan)).toBe(true);
			expect(Object.isFrozen(plan.participants)).toBe(true);
			for (const participant of plan.participants) {
				expect(Object.isFrozen(participant)).toBe(true);
				expect(Object.isFrozen(participant.residualChannels)).toBe(true);
				expect(Object.isFrozen(participant.promotionBlockers)).toBe(true);
			}
		}
	});
});
