import { describe, expect, it } from "bun:test";
import type { BoundsInterpolationProps } from "../../types/bounds.types";
import { BoundStore } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import {
	resolveRevealContentBaseTransform,
	resolveRevealContentBaseTransformFromGeometry,
} from "../../utils/bounds/navigation/reveal/math";
import {
	ZOOM_FOCUSED_ELEMENT_CLOSE_OPACITY_RANGE,
	ZOOM_FOCUSED_ELEMENT_OPEN_OPACITY_RANGE,
	ZOOM_BACKDROP_MAX_OPACITY,
	ZOOM_SCREEN_A_FADE_END,
	ZOOM_UNFOCUSED_ELEMENT_CLOSE_OPACITY_RANGE,
	ZOOM_UNFOCUSED_ELEMENT_OPEN_OPACITY_RANGE,
} from "../../utils/bounds/navigation/zoom/config";
import {
	resolveZoomCrossAxisDragTranslation,
	resolveZoomDragState,
	resolveZoomDismissalNorm,
	resolveZoomDragScale,
	resolveZoomHorizontalDragTranslation,
	resolveZoomPinchScale,
	resolveZoomPrimaryDragTranslation,
} from "../../utils/bounds/navigation/zoom/drag";
import {
	resolveZoomBackdropOpacity,
	resolveZoomPinchFocalOffset,
	resolveZoomTrackedSourceTransform,
} from "../../utils/bounds/navigation/zoom/helpers";
import { buildZoomStyles } from "../../utils/bounds/navigation/zoom/build";

describe("zoom native opacity ownership", () => {
	it("hands focused content in over the configured opening interval", () => {
		expect(ZOOM_FOCUSED_ELEMENT_OPEN_OPACITY_RANGE).toEqual([0, 0.28, 0, 1]);
		expect(ZOOM_UNFOCUSED_ELEMENT_OPEN_OPACITY_RANGE).toEqual([
			1.08, 1.32, 1, 0,
		]);
	});

	it("returns ownership to the source across the latter half of close", () => {
		expect(ZOOM_FOCUSED_ELEMENT_CLOSE_OPACITY_RANGE).toEqual([
			0.13, 0.7, 0, 1,
		]);
		expect(ZOOM_UNFOCUSED_ELEMENT_CLOSE_OPACITY_RANGE).toEqual([
			1.7, 2, 1, 0,
		]);
	});

	it("reaches the screen A dimming ceiling by the measured handoff", () => {
		expect(ZOOM_BACKDROP_MAX_OPACITY).toBe(0.45);
		expect(ZOOM_SCREEN_A_FADE_END).toBe(0.54);
		expect(
			resolveZoomBackdropOpacity({
				transitionProgress: 1,
				dismissalDrag: 0,
				fadeEnd: ZOOM_SCREEN_A_FADE_END,
				maxOpacity: ZOOM_BACKDROP_MAX_OPACITY,
			}),
		).toBe(ZOOM_BACKDROP_MAX_OPACITY);
		expect(
			resolveZoomBackdropOpacity({
				transitionProgress: ZOOM_SCREEN_A_FADE_END,
				dismissalDrag: 0,
				fadeEnd: ZOOM_SCREEN_A_FADE_END,
				maxOpacity: ZOOM_BACKDROP_MAX_OPACITY,
			}),
		).toBe(ZOOM_BACKDROP_MAX_OPACITY);
		expect(
			resolveZoomBackdropOpacity({
				transitionProgress: ZOOM_SCREEN_A_FADE_END / 2,
				dismissalDrag: 0,
				fadeEnd: ZOOM_SCREEN_A_FADE_END,
				maxOpacity: ZOOM_BACKDROP_MAX_OPACITY,
			}),
		).toBeCloseTo(ZOOM_BACKDROP_MAX_OPACITY / 2, 10);
	});

	it("reveals screen A continuously during a live downward drag", () => {
		expect(
			resolveZoomBackdropOpacity({
				transitionProgress: 1,
				dismissalDrag: 0.4,
				fadeEnd: ZOOM_SCREEN_A_FADE_END,
				maxOpacity: ZOOM_BACKDROP_MAX_OPACITY,
			}),
		).toBeCloseTo(ZOOM_BACKDROP_MAX_OPACITY * 0.6, 10);
		expect(
			resolveZoomBackdropOpacity({
				transitionProgress: 0,
				dismissalDrag: 0.4,
				fadeEnd: ZOOM_SCREEN_A_FADE_END,
				maxOpacity: ZOOM_BACKDROP_MAX_OPACITY,
			}),
		).toBe(0);
	});
});

describe("zoom tracking geometry", () => {
	it("reuses one geometry snapshot across transition phases", () => {
		const geometry = {
			tx: 60,
			ty: -20,
			s: 0.4,
			entering: true,
		};

		expect(
			resolveRevealContentBaseTransformFromGeometry({
				geometry,
				progress: 0.25,
			}),
		).toEqual({
			translateX: 45,
			translateY: -15,
			scale: 0.55,
		});
		expect(
			resolveRevealContentBaseTransformFromGeometry({
				geometry,
				progress: 1,
			}),
		).toEqual({
			translateX: 0,
			translateY: 0,
			scale: 1,
		});
	});
});

describe("zoom pan drag tuning", () => {
	it("reduces live scale-down during a downward drag", () => {
		const fullDragScale = resolveZoomDragScale(1);
		const partialDragScale = resolveZoomDragScale(0.3);

		expect(fullDragScale).toBeCloseTo(0.5, 10);
		expect(partialDragScale).toBeGreaterThan(fullDragScale);
		expect(partialDragScale).toBeLessThan(1);
	});

	it("increases live scale during an upward drag", () => {
		const fullDragScale = resolveZoomDragScale(-1);
		const partialDragScale = resolveZoomDragScale(-0.3);
		const extendedDragScale = resolveZoomDragScale(-2);

		expect(partialDragScale).toBeGreaterThan(1);
		expect(partialDragScale).toBeLessThan(fullDragScale);
		expect(extendedDragScale).toBeGreaterThan(fullDragScale);
	});

	it("increases rendered resistance across a longer downward drag", () => {
		const gestureTranslation = 100;
		const screenHeight = 844;
		const renderedTranslation = resolveZoomPrimaryDragTranslation({
			translation: gestureTranslation,
			dimension: screenHeight,
		});
		const longGestureTranslation = 500;
		const longRenderedTranslation = resolveZoomPrimaryDragTranslation({
			translation: longGestureTranslation,
			dimension: screenHeight,
		});

		expect(renderedTranslation).toBeLessThan(gestureTranslation * 0.8);
		expect(longRenderedTranslation / longGestureTranslation).toBeLessThan(
			renderedTranslation / gestureTranslation,
		);
	});

	it("mirrors the resisted translation during an upward drag", () => {
		const downwardTranslation = resolveZoomPrimaryDragTranslation({
			translation: 100,
			dimension: 844,
		});
		const upwardTranslation = resolveZoomPrimaryDragTranslation({
			translation: -100,
			dimension: 844,
		});

		expect(upwardTranslation).toBeCloseTo(-downwardTranslation, 10);
	});

	it("heavily resists lateral movement during a vertical drag", () => {
		const gestureTranslation = 100;
		const rightTranslation = resolveZoomCrossAxisDragTranslation({
			translation: gestureTranslation,
			dimension: 390,
		});
		const leftTranslation = resolveZoomCrossAxisDragTranslation({
			translation: -gestureTranslation,
			dimension: 390,
		});

		expect(rightTranslation).toBeLessThan(gestureTranslation * 0.4);
		expect(leftTranslation).toBeCloseTo(-rightTranslation, 10);
	});

	it("mirrors normalized drag around the vertical dismissal direction", () => {
		expect(resolveZoomDismissalNorm(0.4, false)).toBe(0.4);
		expect(resolveZoomDismissalNorm(-0.4, true)).toBe(0.4);
		expect(resolveZoomDismissalNorm(0.4, true)).toBe(-0.4);
	});

	it("uses horizontal motion as the primary axis without collapsing the mask", () => {
		const handoff = {
			x: 120,
			y: 40,
			normX: 0.4,
			normY: 0.05,
			velocity: 0,
			scale: 1,
			normScale: 0,
			focalX: 0,
			focalY: 0,
			pinchOriginX: 0,
			pinchOriginY: 0,
			rotation: 0,
			raw: {
				x: 120,
				y: 40,
				normX: 0.4,
				normY: 0.05,
				scale: 1,
				normScale: 0,
				rotation: 0,
			},
			active: "horizontal" as const,
			direction: "horizontal" as const,
		};
		const gesture: BoundsInterpolationProps["active"]["gesture"] = {
			...handoff,
			handoff,
			dismissing: 0,
			dragging: 1,
			settling: 0,
			normalizedX: 0.4,
			normalizedY: 0.05,
			isDismissing: 0,
			isDragging: 1,
		};
		const screenLayout = { width: 390, height: 844 };
		const sourceBounds = {
			x: 154,
			y: 400,
			pageX: 154,
			pageY: 400,
			width: 82,
			height: 82,
		};
		const trackingContentTarget = {
			x: 0,
			y: 0,
			pageX: 0,
			pageY: 0,
			width: 390,
			height: 844,
		};
		const collapsedContentScale = resolveRevealContentBaseTransform({
			progress: 0,
			sourceBounds,
			destinationBounds: trackingContentTarget,
			screenLayout,
		}).scale;

		const drag = resolveZoomDragState({
			gesture,
			activeTransitionProgress: 1,
			screenLayout,
			collapsedContentScale,
		});

		expect(drag.dragX).toBe(
			resolveZoomHorizontalDragTranslation({
				translation: gesture.x,
				dimension: screenLayout.width,
			}),
		);
		expect(drag.dragX).toBeGreaterThan(
			resolveZoomPrimaryDragTranslation({
				translation: gesture.x,
				dimension: screenLayout.width,
			}),
		);
		expect(drag.dragY).toBe(
			resolveZoomCrossAxisDragTranslation({
				translation: gesture.y,
				dimension: screenLayout.height,
			}),
		);
		expect(drag.gestureScale).toBeLessThan(1);
		expect(drag.dismissNorm).toBe(0.4);
		expect(drag.collapsesMask).toBe(false);

		const softenedDrag = resolveZoomDragState({
			gesture,
			activeTransitionProgress: 1,
			screenLayout,
			collapsedContentScale,
			dragOptions: {
				translation: { horizontal: 0.5 },
				scale: { horizontal: 0 },
			},
		});

		expect(softenedDrag.dragX).toBeCloseTo(drag.dragX * 0.5, 10);
		expect(softenedDrag.dragY).toBeCloseTo(drag.dragY * 0.5, 10);
		expect(softenedDrag.gestureScale).toBe(1);

		const inverseHandoff = {
			...handoff,
			x: -120,
			normX: -0.4,
			raw: {
				...handoff.raw,
				x: -120,
				normX: -0.4,
			},
			active: "horizontal-inverted" as const,
			direction: "horizontal-inverted" as const,
		};
		const inverseGesture: BoundsInterpolationProps["active"]["gesture"] = {
			...gesture,
			...inverseHandoff,
			handoff: inverseHandoff,
			normalizedX: -0.4,
		};
		const inverseDrag = resolveZoomDragState({
			gesture: inverseGesture,
			activeTransitionProgress: 1,
			screenLayout,
			collapsedContentScale,
		});

		expect(inverseDrag.dragX).toBeLessThan(0);
		expect(inverseDrag.gestureScale).toBeLessThan(1);
		expect(inverseDrag.dismissNorm).toBe(0.4);
		expect(inverseDrag.collapsesMask).toBe(false);
	});

	it("applies direct translation, scale, and rotation to pinch-in", () => {
		const handoff = {
			x: 48,
			y: -32,
			normX: 0.1,
			normY: -0.05,
			velocity: 0,
			scale: 0.7,
			normScale: -0.3,
			focalX: 195,
			focalY: 422,
			pinchOriginX: 195,
			pinchOriginY: 422,
			rotation: 0.25,
			raw: {
				x: 48,
				y: -32,
				normX: 0.1,
				normY: -0.05,
				scale: 0.7,
				normScale: -0.3,
				rotation: 0.25,
			},
			active: "pinch-in" as const,
			direction: null,
		};
		const gesture: BoundsInterpolationProps["active"]["gesture"] = {
			...handoff,
			handoff,
			dismissing: 0,
			dragging: 1,
			settling: 0,
			normalizedX: 0.1,
			normalizedY: -0.05,
			isDismissing: 0,
			isDragging: 1,
		};
		const screenLayout = { width: 390, height: 844 };
		const sourceBounds = {
			x: 154,
			y: 400,
			pageX: 154,
			pageY: 400,
			width: 82,
			height: 82,
		};
		const trackingContentTarget = {
			x: 0,
			y: 0,
			pageX: 0,
			pageY: 0,
			width: 390,
			height: 844,
		};
		const collapsedContentScale = resolveRevealContentBaseTransform({
			progress: 0,
			sourceBounds,
			destinationBounds: trackingContentTarget,
			screenLayout,
		}).scale;
		const pinch = resolveZoomDragState({
			gesture,
			activeTransitionProgress: 1,
			screenLayout,
			collapsedContentScale,
		});

		expect(pinch.dragX).toBe(gesture.x);
		expect(pinch.dragY).toBe(gesture.y);
		expect(pinch.gestureScale).toBe(resolveZoomPinchScale(gesture.scale));
		expect(pinch.gestureScale).toBe(gesture.scale);
		expect(pinch.rotation).toBe(gesture.rotation);
		expect(pinch.dismissNorm).toBe(0.3);
		expect(pinch.collapsesMask).toBe(false);

		const outwardHandoff = {
			...handoff,
			scale: 1.25,
			normScale: 0.25,
			raw: {
				...handoff.raw,
				scale: 1.25,
				normScale: 0.25,
			},
		};
		const outwardGesture: BoundsInterpolationProps["active"]["gesture"] = {
			...gesture,
			...outwardHandoff,
			handoff: outwardHandoff,
		};
		const outwardPinch = resolveZoomDragState({
			gesture: outwardGesture,
			activeTransitionProgress: 1,
			screenLayout,
			collapsedContentScale,
		});

		expect(outwardPinch.gestureScale).toBeGreaterThan(1);

		const restingReleaseGesture: BoundsInterpolationProps["active"]["gesture"] =
			{
				...gesture,
				dismissing: 1,
				dragging: 0,
				isDismissing: 1,
				isDragging: 0,
			};
		const fastReleaseHandoff = {
			...handoff,
			velocity: 0.5,
		};
		const fastReleaseGesture: BoundsInterpolationProps["active"]["gesture"] = {
			...restingReleaseGesture,
			...fastReleaseHandoff,
			handoff: fastReleaseHandoff,
		};
		const restingRelease = resolveZoomDragState({
			gesture: restingReleaseGesture,
			activeTransitionProgress: 0.5,
			screenLayout,
			collapsedContentScale,
		});
		const fastRelease = resolveZoomDragState({
			gesture: fastReleaseGesture,
			activeTransitionProgress: 0.5,
			screenLayout,
			collapsedContentScale,
		});

		expect(fastRelease.dismissContentScale).toBeLessThan(
			restingRelease.dismissContentScale,
		);
	});
});

describe("zoom pinch focal point", () => {
	it("keeps the initial two-finger centroid fixed through scale and rotation", () => {
		const screenLayout = { width: 390, height: 844 };
		const rawGestureTranslationX = 24;
		const rawGestureTranslationY = -18;
		const focalX = 310;
		const focalY = 260;
		const gestureScale = 0.72;
		const rotation = 0.25;
		const originX = focalX - rawGestureTranslationX;
		const originY = focalY - rawGestureTranslationY;
		const focalOffset = resolveZoomPinchFocalOffset({
			gestureScale,
			pinchOriginX: originX,
			pinchOriginY: originY,
			progress: 1,
			rotation,
			screenLayout,
		});
		const screenCenterX = screenLayout.width / 2;
		const screenCenterY = screenLayout.height / 2;
		const originOffsetX = originX - screenCenterX;
		const originOffsetY = originY - screenCenterY;
		const cosine = Math.cos(rotation);
		const sine = Math.sin(rotation);
		const transformedOriginX =
			screenCenterX +
			rawGestureTranslationX +
			focalOffset.x +
			gestureScale *
				(originOffsetX * cosine - originOffsetY * sine);
		const transformedOriginY =
			screenCenterY +
			rawGestureTranslationY +
			focalOffset.y +
			gestureScale *
				(originOffsetX * sine + originOffsetY * cosine);

		expect(transformedOriginX).toBeCloseTo(focalX, 10);
		expect(transformedOriginY).toBeCloseTo(focalY, 10);
	});

	it("does not add an offset for an identity gesture transform", () => {
		expect(
			resolveZoomPinchFocalOffset({
				gestureScale: 1,
				pinchOriginX: 0,
				pinchOriginY: 0,
				progress: 1,
				rotation: 0,
				screenLayout: { width: 390, height: 844 },
			}),
		).toEqual({ x: 0, y: 0 });
	});

	it("retires the frozen release offset monotonically during dismissal", () => {
		const params = {
			gestureScale: 0.72,
			pinchOriginX: 286,
			pinchOriginY: 278,
			rotation: 0.25,
			screenLayout: { width: 390, height: 844 },
		};
		const releaseOffset = resolveZoomPinchFocalOffset({
			...params,
			progress: 1,
		});
		const halfwayOffset = resolveZoomPinchFocalOffset({
			...params,
			progress: 0.5,
		});
		const settledOffset = resolveZoomPinchFocalOffset({
			...params,
			progress: 0,
		});

		expect(halfwayOffset.x).toBeCloseTo(releaseOffset.x * 0.5, 10);
		expect(halfwayOffset.y).toBeCloseTo(releaseOffset.y * 0.5, 10);
		expect(settledOffset.x).toBeCloseTo(0, 10);
		expect(settledOffset.y).toBeCloseTo(0, 10);
	});

});

describe("zoom source tracking", () => {
	it("keeps the source top attached when close outruns the drag reset", () => {
		(globalThis as any).resetMutableRegistry();

		const screenLayout = { width: 390, height: 844 };
		const sourceBounds = {
			x: 154,
			y: 400,
			pageX: 154,
			pageY: 400,
			width: 82,
			height: 82,
		};
		const destinationBounds = {
			x: 0,
			y: 0,
			pageX: 0,
			pageY: 0,
			width: 390,
			height: 844,
		};
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		BoundStore.link.setSource(
			pairKey,
			"card",
			"screen-a",
			sourceBounds,
			{ borderRadius: 24 },
		);
		BoundStore.link.setDestination(
			pairKey,
			"card",
			"screen-b",
			destinationBounds,
			{ borderRadius: 64 },
		);

		const progress = 0.9;
		const handoff = {
			x: 0,
			y: 500,
			normX: 0,
			normY: 0.7,
			velocity: 1,
			scale: 1,
			normScale: 0,
			focalX: 0,
			focalY: 0,
			pinchOriginX: 0,
			pinchOriginY: 0,
			rotation: 0,
			raw: {
				x: 0,
				y: 500,
				normX: 0,
				normY: 0.7,
				scale: 1,
				normScale: 0,
				rotation: 0,
			},
			active: "vertical",
			direction: "vertical",
		};
		const gesture = {
			...handoff,
			y: 455,
			normY: 0.637,
			handoff,
			dismissing: 1,
			dragging: 0,
			settling: 1,
			normalizedX: 0,
			normalizedY: 0.637,
			isDismissing: 1,
			isDragging: 0,
		};
		const active = {
			transitionProgress: progress,
			gesture,
			animating: true,
			closing: true,
			entering: false,
			settled: false,
		};
		const sharedProps = {
			active,
			progress,
			layouts: { screen: screenLayout },
			insets: { top: 0, right: 0, bottom: 34, left: 0 },
		};
		const focusedStyles = buildZoomStyles({
			tag: "card",
			props: {
				...sharedProps,
				transitionProgress: progress,
				focused: true,
				previous: { route: { key: "screen-a" }, transitionProgress: 1 },
				current: {
					route: { key: "screen-b" },
					transitionProgress: progress,
					options: { navigationMaskEnabled: true },
				},
				} as any,
			zoomOptions: {},
		});
		const unfocusedStyles = buildZoomStyles({
			tag: "card",
			props: {
				...sharedProps,
				transitionProgress: 1 + progress,
				focused: false,
				current: {
					route: { key: "screen-a" },
					transitionProgress: 1,
					options: { navigationMaskEnabled: true },
				},
				next: {
					route: { key: "screen-b" },
					transitionProgress: progress,
				},
				} as any,
			zoomOptions: {},
		});

		const focusedTransform = focusedStyles.content?.style?.transform as any[];
		const focusedTranslateY = focusedTransform[1]?.translateY as number;
		const focusedScale = focusedTransform[2]?.scale as number;
		const unfocusedParentScale = (
			unfocusedStyles.content?.style?.transform as any[]
		)[0]?.scale as number;
		const sourceTransform = (unfocusedStyles.card?.style?.transform ??
			[]) as any[];
		const sourceTranslateY = sourceTransform[1]?.translateY as number;
		const sourceScaleY = sourceTransform.find(
			(value) => value.scaleY !== undefined,
		)?.scaleY as number;
		const screenCenterY = screenLayout.height / 2;
		const focusedTop =
			screenCenterY +
			(0 - screenCenterY) * focusedScale +
			focusedTranslateY;
		const sourceCenterY = sourceBounds.pageY + sourceBounds.height / 2;
		const sourceTop =
			screenCenterY +
			(sourceCenterY + sourceTranslateY - screenCenterY) *
				unfocusedParentScale -
			(sourceBounds.height *
				sourceScaleY *
				unfocusedParentScale) /
				2;

		expect(sourceTop).toBeCloseTo(focusedTop, 8);
	});

	it("does not move focused content below its held release position", () => {
		(globalThis as any).resetMutableRegistry();

		const screenLayout = { width: 390, height: 844 };
		const sourceBounds = {
			x: 154,
			y: 400,
			pageX: 154,
			pageY: 400,
			width: 82,
			height: 82,
		};
		const destinationBounds = {
			x: 0,
			y: 0,
			pageX: 0,
			pageY: 0,
			width: 390,
			height: 844,
		};
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		BoundStore.link.setSource(
			pairKey,
			"card",
			"screen-a",
			sourceBounds,
			{ borderRadius: 24 },
		);
		BoundStore.link.setDestination(
			pairKey,
			"card",
			"screen-b",
			destinationBounds,
			{ borderRadius: 64 },
		);

		const handoff = {
			x: 0,
			y: 500,
			normX: 0,
			normY: 0.7,
			velocity: 0,
			scale: 1,
			normScale: 0,
			focalX: 0,
			focalY: 0,
			pinchOriginX: 0,
			pinchOriginY: 0,
			rotation: 0,
			raw: {
				x: 0,
				y: 500,
				normX: 0,
				normY: 0.7,
				scale: 1,
				normScale: 0,
				rotation: 0,
			},
			active: "vertical",
			direction: "vertical",
		};
		const getTranslateY = ({
			progress,
			y,
			normY,
			dismissing,
		}: {
			progress: number;
			y: number;
			normY: number;
			dismissing: number;
		}) => {
			const gesture = {
				...handoff,
				y,
				normY,
				handoff,
				dismissing,
				dragging: dismissing ? 0 : 1,
				settling: dismissing,
				normalizedX: 0,
				normalizedY: normY,
				isDismissing: dismissing,
				isDragging: dismissing ? 0 : 1,
			};
			const styles = buildZoomStyles({
				tag: "card",
				props: {
					active: {
						transitionProgress: progress,
						gesture,
						animating: true,
						closing: Boolean(dismissing),
						entering: false,
						settled: false,
					},
					progress,
					layouts: { screen: screenLayout },
					insets: { top: 0, right: 0, bottom: 34, left: 0 },
					focused: true,
					previous: {
						route: { key: "screen-a" },
						transitionProgress: 1,
					},
					current: {
						route: { key: "screen-b" },
						transitionProgress: progress,
						options: { navigationMaskEnabled: true },
					},
				} as any,
				zoomOptions: {},
			});
			const transform = styles.content?.style?.transform as any[];

			return transform[1]?.translateY as number;
		};

		const releaseTranslateY = getTranslateY({
			progress: 1,
			y: handoff.y,
			normY: handoff.normY,
			dismissing: 0,
		});
		const earlyCloseTranslateY = getTranslateY({
			progress: 0.9,
			y: 455,
			normY: 0.637,
			dismissing: 1,
		});

		expect(earlyCloseTranslateY).toBeLessThanOrEqual(releaseTranslateY);
	});

	it("keeps the source top edge attached to the transformed destination top", () => {
		const screenLayout = { width: 390, height: 844 };
		const sourceBounds = {
			x: 154,
			y: 400,
			pageX: 154,
			pageY: 400,
			width: 82,
			height: 82,
		};
		const destinationBounds = {
			x: 0,
			y: 0,
			pageX: 0,
			pageY: 0,
			width: 390,
			height: 390,
		};
		const progress = 0.72;
		const dragX = 24;
		const dragY = 118;
		const gestureScale = 0.76;
		const parentScale = 0.96;
		const contentBase = resolveRevealContentBaseTransform({
			progress,
			sourceBounds,
			destinationBounds,
			screenLayout,
		});
		const collapsedContentScale = resolveRevealContentBaseTransform({
			progress: 0,
			sourceBounds,
			destinationBounds,
			screenLayout,
		}).scale;
		const transform = resolveZoomTrackedSourceTransform({
			contentBaseTransform: contentBase,
			collapsedContentScale,
			sourceBounds,
			destinationBounds,
			screenLayout,
			dragX,
			dragY,
			gestureScale,
			parentScale,
		});
		const contentScale = contentBase.scale * gestureScale;
		const expectedLeft =
			screenLayout.width / 2 +
			(destinationBounds.pageX - screenLayout.width / 2) * contentScale +
			contentBase.translateX +
			dragX;
		const expectedTop =
			screenLayout.height / 2 +
			(destinationBounds.pageY - screenLayout.height / 2) * contentScale +
			contentBase.translateY +
			dragY;
		const sourceCenterX = sourceBounds.pageX + sourceBounds.width / 2;
		const sourceCenterY = sourceBounds.pageY + sourceBounds.height / 2;
		const actualLeft =
			screenLayout.width / 2 +
			(sourceCenterX + transform.translateX - screenLayout.width / 2) *
				parentScale -
			(sourceBounds.width * transform.scaleX * parentScale) / 2;
		const actualTop =
			screenLayout.height / 2 +
			(sourceCenterY + transform.translateY - screenLayout.height / 2) *
				parentScale -
			(sourceBounds.height * transform.scaleY * parentScale) / 2;

		expect(actualLeft).toBeCloseTo(expectedLeft, 8);
		expect(actualTop).toBeCloseTo(expectedTop, 8);
	});

	it("preserves the source aspect ratio for a differently shaped bound target", () => {
		const screenLayout = { width: 390, height: 844 };
		const sourceBounds = {
			x: 188,
			y: 560,
			pageX: 188,
			pageY: 560,
			width: 146,
			height: 220,
		};
		const destinationBounds = {
			x: 40,
			y: 300,
			pageX: 40,
			pageY: 300,
			width: 310,
			height: 140,
		};
		const halfwayContentBase = resolveRevealContentBaseTransform({
			progress: 0.5,
			sourceBounds,
			destinationBounds,
			screenLayout,
		});
		const collapsedContentBase = resolveRevealContentBaseTransform({
			progress: 0,
			sourceBounds,
			destinationBounds,
			screenLayout,
		});

		const halfwayTransform = resolveZoomTrackedSourceTransform({
			contentBaseTransform: halfwayContentBase,
			collapsedContentScale: collapsedContentBase.scale,
			sourceBounds,
			destinationBounds,
			screenLayout,
			dragX: 0,
			dragY: 0,
			gestureScale: 1,
			parentScale: 1,
		});
		const collapsedTransform = resolveZoomTrackedSourceTransform({
			contentBaseTransform: collapsedContentBase,
			collapsedContentScale: collapsedContentBase.scale,
			sourceBounds,
			destinationBounds,
			screenLayout,
			dragX: 0,
			dragY: 0,
			gestureScale: 1,
			parentScale: 1,
		});

		expect(halfwayTransform.scaleX).toBeCloseTo(
			halfwayTransform.scaleY,
			10,
		);
		expect(collapsedTransform.scaleX).toBeCloseTo(1, 10);
		expect(collapsedTransform.scaleY).toBeCloseTo(1, 10);
	});
});
