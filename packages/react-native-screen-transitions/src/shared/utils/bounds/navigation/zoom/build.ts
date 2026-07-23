import { interpolate } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../../constants";
import { getVisualScrollAxisDelta } from "../../../../stores/scroll.store";
import type { ScrollMetadataState } from "../../../../types/gesture.types";
import { createBoundsAccessorCore } from "../../helpers/create-bounds-accessor-core";
import { getSourceBorderRadius } from "../helpers";
import { resolveRevealContentBaseTransform } from "../reveal/math";
import {
	ZOOM_BACKDROP_MAX_OPACITY,
	ZOOM_BACKGROUND_SCALE,
	ZOOM_FOCUSED_ELEMENT_CLOSE_OPACITY_RANGE,
	ZOOM_FOCUSED_ELEMENT_OPEN_OPACITY_RANGE,
	ZOOM_SCREEN_A_FADE_END,
	ZOOM_SHARED_OPTIONS,
	ZOOM_UNFOCUSED_ELEMENT_CLOSE_OPACITY_RANGE,
	ZOOM_UNFOCUSED_ELEMENT_OPEN_OPACITY_RANGE,
} from "./config";
import { resolveZoomDragState, resolveZoomTrackedGestureScale } from "./drag";
import {
	resolveZoomBackdropOpacity,
	resolveZoomPinchFocalOffset,
	resolveZoomTrackedSourceTransform,
} from "./helpers";
import {
	resolveZoomNavigationMaskStyle,
	ZOOM_NAVIGATION_MASK_BORDER_RADIUS,
} from "./mask";
import {
	getZoomContentAnchor,
	getZoomContentTarget,
	resolveZoomTrackingContentTarget,
} from "./targets";
import type { BuildZoomStylesParams, ZoomInterpolatedStyle } from "./types";

export function buildZoomStyles({
	tag,
	props,
	zoomOptions,
}: BuildZoomStylesParams): ZoomInterpolatedStyle {
	"worklet";

	if (!tag) {
		return {};
	}

	const target = zoomOptions?.target;
	const keepFocusedVisible = zoomOptions?.keepFocusedVisible === true;
	const expandedBorderRadius = Math.max(
		0,
		zoomOptions?.borderRadius ?? ZOOM_NAVIGATION_MASK_BORDER_RADIUS,
	);
	const backgroundScale = zoomOptions?.backgroundScale ?? ZOOM_BACKGROUND_SCALE;
	const backdropColor = zoomOptions?.backdropColor ?? "black";
	const maxBackdropOpacity =
		zoomOptions?.backdropOpacity ?? ZOOM_BACKDROP_MAX_OPACITY;

	const {
		active,
		current,
		focused,
		transitionProgress,
		layouts: { screen: screenLayout },
	} = props;

	const activeTransitionProgress = active.transitionProgress;

	const bounds = createBoundsAccessorCore({
		getProps: () => props,
	});

	const scopedBounds = bounds(tag);
	const link = scopedBounds.link();
	const sourceBounds = link?.source?.bounds;

	if (!link || !sourceBounds) {
		if (target !== "bound") {
			scopedBounds.values({
				scaleMode: ZOOM_SHARED_OPTIONS.scaleMode,
				anchor: ZOOM_SHARED_OPTIONS.anchor,
				method: "content",
				target: target ?? "fullscreen",
				progress: transitionProgress,
			});
		}

		return {};
	}

	const zoomContentTarget = getZoomContentTarget({
		explicitTarget: target,
		screenLayout,
		link,
	});
	const zoomContentAnchor = getZoomContentAnchor({
		explicitTarget: target,
		screenLayout,
		link,
	});
	const trackingContentTarget = resolveZoomTrackingContentTarget({
		contentTarget: zoomContentTarget,
		link,
		screenLayout,
	});

	if (!trackingContentTarget) {
		return {};
	}

	const drag = resolveZoomDragState({
		gesture: active.gesture,
		activeTransitionProgress,
		screenLayout,
		sourceBounds,
		trackingContentTarget,
		dragOptions: zoomOptions?.drag,
	});

	const trackedGestureScale = resolveZoomTrackedGestureScale({
		drag,
		activeTransitionProgress,
		screenLayout,
		sourceBounds,
		trackingContentTarget,
	});

	const focalGesture = drag.isDismissing
		? active.gesture.handoff
		: active.gesture;

	const focalProgress = drag.isDismissing ? activeTransitionProgress : 1;
	const pinchFocalOffset =
		active.gesture.handoff.active === "pinch-in"
			? resolveZoomPinchFocalOffset({
					gestureScale: drag.isDismissing
						? focalGesture.scale
						: trackedGestureScale,
					pinchOriginX: focalGesture.pinchOriginX,
					pinchOriginY: focalGesture.pinchOriginY,
					progress: focalProgress,
					rotation: drag.isDismissing ? focalGesture.rotation : drag.rotation,
					screenLayout,
				})
			: { x: 0, y: 0 };

	if (focused) {
		const capturedSourceScroll = (
			sourceBounds as typeof sourceBounds & {
				scroll?: ScrollMetadataState | null;
			}
		).scroll;
		const liveSourceScroll = props.inactive?.layouts.scroll;
		const sourceScrollWeight =
			keepFocusedVisible && (active.entering || active.closing)
				? 1 - Math.min(Math.max(activeTransitionProgress, 0), 1)
				: 0;
		const sourceScrollDeltaX =
			getVisualScrollAxisDelta(
				liveSourceScroll,
				capturedSourceScroll,
				"horizontal",
			) * sourceScrollWeight;
		const sourceScrollDeltaY =
			getVisualScrollAxisDelta(
				liveSourceScroll,
				capturedSourceScroll,
				"vertical",
			) * sourceScrollWeight;
		const sourceBorderRadius = getSourceBorderRadius(link);
		const navigationMaskEnabled = current.options.navigationMaskEnabled;
		const backdropOpacity = resolveZoomBackdropOpacity({
			transitionProgress,
			dismissalDrag: drag.dismissNorm,
			fadeEnd: ZOOM_SCREEN_A_FADE_END,
			maxOpacity: maxBackdropOpacity,
		});

		const contentRaw = scopedBounds.values({
			scaleMode: ZOOM_SHARED_OPTIONS.scaleMode,
			anchor: zoomContentAnchor,
			method: "content",
			target: zoomContentTarget,
			progress: transitionProgress,
		});

		const focusedOpacityRange = active.closing
			? ZOOM_FOCUSED_ELEMENT_CLOSE_OPACITY_RANGE
			: ZOOM_FOCUSED_ELEMENT_OPEN_OPACITY_RANGE;

		const focusedFade = interpolate(
			transitionProgress,
			[focusedOpacityRange[0], focusedOpacityRange[1]],
			[focusedOpacityRange[2], focusedOpacityRange[3]],
			"clamp",
		);

		const contentBaseTranslateX = contentRaw.translateX;
		const contentBaseTranslateY = contentRaw.translateY;
		const contentBaseScale = contentRaw.scale;

		const contentTranslateX =
			contentBaseTranslateX +
			drag.dragX +
			pinchFocalOffset.x * contentBaseScale -
			sourceScrollDeltaX;
		const contentTranslateY =
			contentBaseTranslateY +
			drag.dragY +
			pinchFocalOffset.y * contentBaseScale -
			sourceScrollDeltaY;
		const contentScale = drag.isDismissing
			? drag.dismissContentScale
			: contentBaseScale * drag.gestureScale;

		return {
			options: {
				gestureReleaseVelocityScale: 0.5,
			},
			backdrop: {
				style: {
					backgroundColor: backdropColor,
					opacity: backdropOpacity,
				},
			},
			content: {
				style: {
					...(keepFocusedVisible ? {} : { opacity: focusedFade }),
					transform: [
						{ translateX: contentTranslateX },
						{ translateY: contentTranslateY },
						{ scale: contentScale },
						{ rotateZ: `${drag.rotation}rad` },
					],
					borderRadius: interpolate(
						transitionProgress,
						[0, 1],
						[sourceBorderRadius, active.animating ? expandedBorderRadius : 0],
						"clamp",
					),
					overflow: "hidden" as const,
				},
			},
			[NAVIGATION_MASK_ELEMENT_STYLE_ID]: navigationMaskEnabled
				? resolveZoomNavigationMaskStyle({
						scopedBounds,
						link,
						sourceBounds,
						screenLayout,
						transitionProgress,
						drag,
						contentTransform: contentRaw,
						sourceBorderRadius,
						expandedBorderRadius,
						active,
						anchor: zoomContentAnchor,
					})
				: {},
		};
	}

	const unfocusedOpacityRange = active.closing
		? ZOOM_UNFOCUSED_ELEMENT_CLOSE_OPACITY_RANGE
		: ZOOM_UNFOCUSED_ELEMENT_OPEN_OPACITY_RANGE;
	const unfocusedFade = interpolate(
		transitionProgress,
		[unfocusedOpacityRange[0], unfocusedOpacityRange[1]],
		[unfocusedOpacityRange[2], unfocusedOpacityRange[3]],
		"clamp",
	);
	const unfocusedScale = interpolate(
		transitionProgress,
		[1, 2],
		[1, backgroundScale],
		"clamp",
	);

	const shouldHideSource = !active.closing && unfocusedFade <= EPSILON;
	const unfocusedContentScale = active.settled ? 1 : unfocusedScale;
	const unfocusedContent = {
		style: {
			transform: [{ scale: unfocusedContentScale }],
		},
	};

	// To avoid measuring a component from a bad position,
	// we'll want to hide + reset this component when the animation has reached a visual settling point
	if (shouldHideSource || active.settled) {
		return {
			content: unfocusedContent,
			[link.id]: {
				style: {
					transform: [
						{ translateX: 0 },
						{ translateY: 0 },
						{ scaleX: 1 },
						{ scaleY: 1 },
					],
					opacity: shouldHideSource ? 0 : unfocusedFade,
				},
			},
		};
	}

	const trackedContentBaseScale = resolveRevealContentBaseTransform({
		progress: activeTransitionProgress,
		sourceBounds,
		destinationBounds: trackingContentTarget,
		screenLayout,
	}).scale;
	const trackedDragX =
		drag.dragX + pinchFocalOffset.x * trackedContentBaseScale;
	const trackedDragY =
		drag.dragY + pinchFocalOffset.y * trackedContentBaseScale;

	const trackedSourceElement = resolveZoomTrackedSourceTransform({
		progress: activeTransitionProgress,
		sourceBounds,
		destinationBounds: trackingContentTarget,
		screenLayout,
		dragX: trackedDragX,
		dragY: trackedDragY,
		gestureScale: trackedGestureScale,
		parentScale: unfocusedContentScale,
		rotation: drag.rotation,
		anchor: zoomContentAnchor,
	});

	return {
		content: unfocusedContent,
		[link.id]: {
			style: {
				transform: [
					{ translateX: trackedSourceElement.translateX },
					{ translateY: trackedSourceElement.translateY },
					{ rotateZ: `${drag.rotation}rad` },
					{ scaleX: trackedSourceElement.scaleX },
					{ scaleY: trackedSourceElement.scaleY },
				],
				opacity: unfocusedFade,
			},
		},
	};
}
