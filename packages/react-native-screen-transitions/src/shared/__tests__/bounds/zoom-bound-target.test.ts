import { beforeEach, describe, expect, it } from "bun:test";
import { makeMutable } from "react-native-reanimated";
import { getInitialDestinationMeasurementSignal } from "../../components/boundary/utils/destination-signals";
import { getRefreshBoundarySignal } from "../../components/boundary/utils/refresh-signals";
import { getInitialSourceCaptureSignal } from "../../components/boundary/utils/source-signals";
import { NAVIGATION_MASK_ELEMENT_STYLE_ID } from "../../constants";
import { applyMeasuredBoundsWrites } from "../../providers/helpers/measured-bounds-writes";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import { pairs } from "../../stores/bounds/internals/state";
import { buildZoomStyles } from "../../utils/bounds/navigation/zoom/build";
import {
	getZoomContentAnchor,
	getZoomContentTarget,
} from "../../utils/bounds/navigation/zoom/targets";
import { animateToProgress } from "../../utils/animation/animate-to-progress";

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

const registerSource = () => {
	BoundStore.link.setSource(
		PAIR_KEY,
		"card",
		"screen-a",
		SOURCE_BOUNDS,
		{ borderRadius: 14 },
	);
};

const registerDestination = () => {
	BoundStore.link.setDestination(
		PAIR_KEY,
		"card",
		"screen-b",
		DESTINATION_BOUNDS,
		{ borderRadius: 28 },
	);
};

const createIdleGesture = () => {
	const handoff = {
		x: 0,
		y: 0,
		normX: 0,
		normY: 0,
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
			y: 0,
			normX: 0,
			normY: 0,
			scale: 1,
			normScale: 0,
			rotation: 0,
		},
		active: null,
		direction: null,
	};

	return {
		...handoff,
		handoff,
		dismissing: 0,
		dragging: 0,
		settling: 0,
		normalizedX: 0,
		normalizedY: 0,
		isDismissing: 0,
		isDragging: 0,
	};
};

const createZoomProps = ({
	focused,
	progress,
}: {
	focused: boolean;
	progress: number;
}) =>
	({
		active: {
			transitionProgress: progress,
			gesture: createIdleGesture(),
			animating: true,
			closing: true,
			entering: false,
			settled: false,
		},
		progress,
		transitionProgress: focused ? progress : 1 + progress,
		layouts: { screen: SCREEN_LAYOUT },
		insets: { top: 0, right: 0, bottom: 34, left: 0 },
		focused,
		...(focused
			? {
					previous: {
						route: { key: "screen-a" },
						transitionProgress: 1,
					},
					current: {
						route: { key: "screen-b" },
						transitionProgress: progress,
						options: { navigationMaskEnabled: true },
					},
				}
			: {
					current: {
						route: { key: "screen-a" },
						transitionProgress: 1,
						options: { navigationMaskEnabled: true },
					},
					next: {
						route: { key: "screen-b" },
						transitionProgress: progress,
					},
				}),
	}) as any;

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("zoom bound target", () => {
	it("does not refresh completed target bounds during an initial entrance", () => {
		registerSource();
		registerDestination();
		const animations = AnimationStore.getBag("screen-b");

		animateToProgress({
			target: "open",
			emitWillAnimate: false,
			animations,
			targetProgress: makeMutable(0),
			animationProgress: makeMutable(0),
		});

		const refresh = getRefreshBoundarySignal({
			enabled: true,
			currentScreenKey: "screen-b",
			pairKey: PAIR_KEY,
			linkId: "card",
			shouldRefresh: animations.willAnimate.get() === 1,
			closing: false,
			linkState: pairs.get(),
		});

		expect(refresh).toBeNull();
		expect(BoundStore.link.getDestination(PAIR_KEY, "card")?.bounds).toEqual(
			DESTINATION_BOUNDS,
		);
	});

	it("keeps bound targeting opt-in", () => {
		registerSource();
		registerDestination();
		const link = BoundStore.link.getLink(PAIR_KEY, "card");
		if (!link) {
			throw new Error("Expected the registered zoom link");
		}

		expect(
			getZoomContentTarget({
				explicitTarget: "bound",
				screenLayout: SCREEN_LAYOUT,
				link,
			}),
		).toBe("bound");
		expect(
			getZoomContentTarget({
				explicitTarget: undefined,
				screenLayout: SCREEN_LAYOUT,
				link,
			}),
		).toEqual({
			x: 0,
			y: 0,
			pageX: 0,
			pageY: 0,
			width: 390,
			height: 390,
		});
	});

	it("anchors tall default targets to the destination leading edge", () => {
		registerSource();
		const link = BoundStore.link.getLink(PAIR_KEY, "card");
		if (!link) {
			throw new Error("Expected the registered zoom link");
		}
		const tallSource = {
			...SOURCE_BOUNDS,
			width: 84,
			height: 354,
		};
		BoundStore.link.setSource(PAIR_KEY, "card", "screen-a", tallSource, {
			borderRadius: 14,
		});
		const tallLink = BoundStore.link.getLink(PAIR_KEY, "card");
		if (!tallLink) {
			throw new Error("Expected the tall zoom link");
		}

		expect(
			getZoomContentTarget({
				explicitTarget: undefined,
				screenLayout: SCREEN_LAYOUT,
				link: tallLink,
			}),
		).toEqual({
			x: 0,
			y: 0,
			pageX: 0,
			pageY: 0,
			width: (84 / 354) * SCREEN_LAYOUT.height,
			height: SCREEN_LAYOUT.height,
		});
		expect(
			getZoomContentAnchor({
				explicitTarget: undefined,
				screenLayout: SCREEN_LAYOUT,
				link: tallLink,
			}),
		).toBe("leading");
		expect(
			getZoomContentAnchor({
				explicitTarget: "fullscreen",
				screenLayout: SCREEN_LAYOUT,
				link: tallLink,
			}),
		).toBe("top");
	});

	it("applies the public zoom appearance controls", () => {
		registerSource();
		registerDestination();
		const zoomOptions = {
			target: "bound" as const,
			borderRadius: 36,
			backgroundScale: 0.9,
			backdropColor: "#123456",
			backdropOpacity: 0.2,
		};
		const focusedStyles = buildZoomStyles({
			tag: "card",
			props: createZoomProps({ focused: true, progress: 1 }),
			zoomOptions,
		});
		const unfocusedStyles = buildZoomStyles({
			tag: "card",
			props: createZoomProps({ focused: false, progress: 1 }),
			zoomOptions,
		});
		const focusedBackdrop = focusedStyles.backdrop?.style as any;
		const focusedContent = focusedStyles.content?.style as any;
		const focusedMask = focusedStyles[NAVIGATION_MASK_ELEMENT_STYLE_ID]
			?.style as any;
		const unfocusedContent = unfocusedStyles.content?.style as any;

		expect(focusedBackdrop.backgroundColor).toBe("#123456");
		expect(focusedBackdrop.opacity).toBeCloseTo(0.2, 10);
		expect(focusedContent.borderRadius).toBe(36);
		expect(focusedMask.borderRadius).toBe(36);
		expect(unfocusedContent.transform[0]?.scale).toBeCloseTo(0.9, 10);
	});

	it("places the destination bound over the source while the navigation mask enters", () => {
		registerSource();
		registerDestination();

		const styles = buildZoomStyles({
			tag: "card",
			props: createZoomProps({ focused: true, progress: 0 }),
			zoomOptions: { target: "bound" },
		});
		const contentTransform = styles.content?.style?.transform as any[];
		const contentTranslateX = contentTransform[0]?.translateX as number;
		const contentTranslateY = contentTransform[1]?.translateY as number;
		const contentScale = contentTransform[2]?.scale as number;
		const mask = styles[NAVIGATION_MASK_ELEMENT_STYLE_ID]?.style as any;
		const screenCenterX = SCREEN_LAYOUT.width / 2;
		const screenCenterY = SCREEN_LAYOUT.height / 2;
		const destinationCenterX =
			DESTINATION_BOUNDS.pageX + DESTINATION_BOUNDS.width / 2;
		const destinationCenterY =
			DESTINATION_BOUNDS.pageY + DESTINATION_BOUNDS.height / 2;
		const placedDestinationCenterX =
			screenCenterX +
			(destinationCenterX - screenCenterX) * contentScale +
			contentTranslateX;
		const placedDestinationCenterY =
			screenCenterY +
			(destinationCenterY - screenCenterY) * contentScale +
			contentTranslateY;
		const sourceCenterX = SOURCE_BOUNDS.pageX + SOURCE_BOUNDS.width / 2;
		const sourceCenterY = SOURCE_BOUNDS.pageY + SOURCE_BOUNDS.height / 2;

		expect(placedDestinationCenterX).toBeCloseTo(sourceCenterX, 8);
		expect(placedDestinationCenterY).toBeCloseTo(sourceCenterY, 8);
		expect(contentScale).toBeCloseTo(
			SOURCE_BOUNDS.width / DESTINATION_BOUNDS.width,
			8,
		);
		expect(mask.width).toBeCloseTo(SOURCE_BOUNDS.width, 8);
		expect(mask.height).toBeCloseTo(SOURCE_BOUNDS.height, 8);
	});

	it("keeps a source-correct mask while a stale destination write misplaces bound content", () => {
		registerSource();
		const staleDestination = {
			...DESTINATION_BOUNDS,
			pageY: DESTINATION_BOUNDS.pageY + 180,
			y: DESTINATION_BOUNDS.y + 180,
		};
		const signal = getInitialDestinationMeasurementSignal({
			enabled: true,
			pairKey: PAIR_KEY,
			linkId: "card",
			destinationPresent: true,
			sourcePresent: true,
			linkState: pairs.get(),
		});

		expect(signal).toEqual({ pairKey: PAIR_KEY, action: "measure" });
		applyMeasuredBoundsWrites({
			entryTag: "card",
			linkId: "card",
			currentScreenKey: "screen-b",
			measured: staleDestination,
			preparedStyles: {},
			linkWrite: { type: "destination", pairKey: PAIR_KEY },
		});

		const staleStyles = buildZoomStyles({
			tag: "card",
			props: createZoomProps({ focused: true, progress: 0 }),
			zoomOptions: { target: "bound" },
		});
		const staleTransform = staleStyles.content?.style?.transform as any[];
		const staleMask = staleStyles[NAVIGATION_MASK_ELEMENT_STYLE_ID]
			?.style as any;

		applyMeasuredBoundsWrites({
			entryTag: "card",
			linkId: "card",
			currentScreenKey: "screen-b",
			measured: DESTINATION_BOUNDS,
			preparedStyles: {},
			linkWrite: { type: "destination", pairKey: PAIR_KEY },
		});

		const measuredStyles = buildZoomStyles({
			tag: "card",
			props: createZoomProps({ focused: true, progress: 0 }),
			zoomOptions: { target: "bound" },
		});
		const measuredTransform = measuredStyles.content?.style?.transform as any[];
		const measuredMask = measuredStyles[NAVIGATION_MASK_ELEMENT_STYLE_ID]
			?.style as any;

		expect(staleMask.width).toBeCloseTo(measuredMask.width, 8);
		expect(staleMask.height).toBeCloseTo(measuredMask.height, 8);
		expect(staleTransform[1]?.translateY).not.toBeCloseTo(
			measuredTransform[1]?.translateY,
			8,
		);
	});

	it("keeps the tracked source attached to the bound-target content", () => {
		registerSource();
		registerDestination();
		const progress = 0.5;
		const zoomOptions = { target: "bound" as const };
		const focusedStyles = buildZoomStyles({
			tag: "card",
			props: createZoomProps({ focused: true, progress }),
			zoomOptions,
		});
		const unfocusedStyles = buildZoomStyles({
			tag: "card",
			props: createZoomProps({ focused: false, progress }),
			zoomOptions,
		});
		const focusedTransform = focusedStyles.content?.style?.transform as any[];
		const focusedTranslateX = focusedTransform[0]?.translateX as number;
		const focusedTranslateY = focusedTransform[1]?.translateY as number;
		const focusedScale = focusedTransform[2]?.scale as number;
		const unfocusedParentScale = (
			unfocusedStyles.content?.style?.transform as any[]
		)[0]?.scale as number;
		const sourceTransform = (unfocusedStyles.card?.style?.transform ??
			[]) as any[];
		const sourceTranslateX = sourceTransform[0]?.translateX as number;
		const sourceTranslateY = sourceTransform[1]?.translateY as number;
		const sourceScaleX = sourceTransform.find(
			(value) => value.scaleX !== undefined,
		)?.scaleX as number;
		const sourceScaleY = sourceTransform.find(
			(value) => value.scaleY !== undefined,
		)?.scaleY as number;
		const screenCenterX = SCREEN_LAYOUT.width / 2;
		const screenCenterY = SCREEN_LAYOUT.height / 2;
		const destinationCenterX =
			DESTINATION_BOUNDS.pageX + DESTINATION_BOUNDS.width / 2;
		const destinationCenterY =
			DESTINATION_BOUNDS.pageY + DESTINATION_BOUNDS.height / 2;
		const focusedCenterX =
			screenCenterX +
			(destinationCenterX - screenCenterX) * focusedScale +
			focusedTranslateX;
		const focusedCenterY =
			screenCenterY +
			(destinationCenterY - screenCenterY) * focusedScale +
			focusedTranslateY;
		const sourceCenterX = SOURCE_BOUNDS.pageX + SOURCE_BOUNDS.width / 2;
		const sourceCenterY = SOURCE_BOUNDS.pageY + SOURCE_BOUNDS.height / 2;
		const trackedSourceCenterX =
			screenCenterX +
			(sourceCenterX + sourceTranslateX - screenCenterX) *
				unfocusedParentScale;
		const trackedSourceCenterY =
			screenCenterY +
			(sourceCenterY + sourceTranslateY - screenCenterY) *
				unfocusedParentScale;

		expect(focusedScale).toBeCloseTo(0.7, 10);
		expect(trackedSourceCenterX).toBeCloseTo(focusedCenterX, 8);
		expect(trackedSourceCenterY).toBeCloseTo(focusedCenterY, 8);
		expect(
			SOURCE_BOUNDS.width * sourceScaleX * unfocusedParentScale,
		).toBeCloseTo(DESTINATION_BOUNDS.width * focusedScale, 8);
		expect(
			SOURCE_BOUNDS.height * sourceScaleY * unfocusedParentScale,
		).toBeCloseTo(DESTINATION_BOUNDS.height * focusedScale, 8);
	});

	it("waits for the destination measurement instead of using fullscreen", () => {
		registerSource();

		expect(
			buildZoomStyles({
				tag: "card",
				props: createZoomProps({ focused: true, progress: 0 }),
				zoomOptions: { target: "bound" },
			}),
		).toEqual({});
	});
});

describe("zoom source-only target", () => {
	it("requests the source measurement before an implicit-target opening", () => {
		buildZoomStyles({
			tag: "card",
			props: createZoomProps({ focused: true, progress: 0 }),
		});

		expect(
			getInitialSourceCaptureSignal({
				enabled: true,
				sourcePairKey: PAIR_KEY,
				linkId: "card",
				linkState: pairs.get(),
			}),
		).toEqual({
			pairKey: PAIR_KEY,
			signal: "source|screen-a<>screen-b|card",
		});
	});

	it("builds opening styles from the source and implicit target alone", () => {
		registerSource();

		const styles = buildZoomStyles({
			tag: "card",
			props: createZoomProps({ focused: true, progress: 0 }),
		});

		expect(styles.content?.style?.transform).toBeDefined();
	});
});

describe("zoom focused visibility", () => {
	const buildFocusedContentStyle = (
		keepFocusedVisible?: boolean,
	) => {
		registerSource();
		registerDestination();

		return buildZoomStyles({
			tag: "card",
			props: createZoomProps({ focused: true, progress: 0.5 }),
			zoomOptions: {
				target: "bound",
				keepFocusedVisible,
			},
		}).content?.style;
	};

	it("keeps the focused opacity fade by default and when explicitly disabled", () => {
		const defaultStyle = buildFocusedContentStyle();
		const explicitlyDisabledStyle = buildFocusedContentStyle(false);

		expect(defaultStyle?.opacity).toBeGreaterThan(0);
		expect(defaultStyle?.opacity).toBeLessThan(1);
		expect(explicitlyDisabledStyle?.opacity).toBe(defaultStyle?.opacity);
	});

	it("keeps focused transforms while omitting opacity when enabled", () => {
		const defaultStyle = buildFocusedContentStyle();
		const keptVisibleStyle = buildFocusedContentStyle(true);

		expect(keptVisibleStyle?.transform).toEqual(defaultStyle?.transform);
		expect(keptVisibleStyle).not.toHaveProperty("opacity");
	});

	it("tracks live source scroll while keeping focused closing content visible", () => {
		BoundStore.link.setSource(
			PAIR_KEY,
			"card",
			"screen-a",
			{
				...SOURCE_BOUNDS,
				scroll: {
					vertical: {
						offset: 100,
						contentSize: 1200,
						layoutSize: 800,
						isTouched: false,
					},
					horizontal: null,
				},
			} as any,
			{ borderRadius: 14 },
		);
		registerDestination();

		const props = createZoomProps({ focused: true, progress: 0.5 });
		props.inactive = {
			...props.previous,
			layouts: {
				scroll: {
					vertical: {
						offset: 140,
						contentSize: 1200,
						layoutSize: 800,
						isTouched: false,
					},
					horizontal: null,
				},
			},
		};

		const defaultTransform = buildZoomStyles({
			tag: "card",
			props,
			zoomOptions: { target: "bound" },
		}).content?.style?.transform as any[];
		const trackedTransform = buildZoomStyles({
			tag: "card",
			props,
			zoomOptions: {
				target: "bound",
				keepFocusedVisible: true,
			},
		}).content?.style?.transform as any[];

		expect(trackedTransform[0]?.translateX).toBe(
			defaultTransform[0]?.translateX,
		);
		expect(trackedTransform[1]?.translateY).toBeCloseTo(
			(defaultTransform[1]?.translateY as number) - 20,
			10,
		);
	});

	it("does not apply a captured in-range scroll offset while entering", () => {
		BoundStore.link.setSource(
			PAIR_KEY,
			"card",
			"screen-a",
			{
				...SOURCE_BOUNDS,
				scroll: {
					vertical: {
						offset: 140,
						contentSize: 1200,
						layoutSize: 800,
						isTouched: false,
					},
					horizontal: null,
				},
			} as any,
			{ borderRadius: 14 },
		);
		registerDestination();
		const props = createZoomProps({ focused: true, progress: 0.5 });
		props.active.closing = false;
		props.active.entering = true;
		props.inactive = {
			...props.previous,
			layouts: {
				scroll: {
					vertical: {
						offset: 140,
						contentSize: 1200,
						layoutSize: 800,
						isTouched: false,
					},
					horizontal: null,
				},
			},
		};

		const defaultStyle = buildZoomStyles({
			tag: "card",
			props,
			zoomOptions: { target: "bound" },
		}).content?.style;
		const keptVisibleStyle = buildZoomStyles({
			tag: "card",
			props,
			zoomOptions: {
				target: "bound",
				keepFocusedVisible: true,
			},
		}).content?.style;

		expect(keptVisibleStyle?.transform).toEqual(defaultStyle?.transform);
	});

	it("starts an entering transition from the visible iOS overscroll position", () => {
		BoundStore.link.setSource(
			PAIR_KEY,
			"card",
			"screen-a",
			{
				...SOURCE_BOUNDS,
				scroll: {
					vertical: {
						offset: -60,
						contentSize: 1200,
						layoutSize: 800,
						isTouched: true,
					},
					horizontal: null,
				},
			} as any,
			{ borderRadius: 14 },
		);
		registerDestination();

		const props = createZoomProps({ focused: true, progress: 0.5 });
		props.active.closing = false;
		props.active.entering = true;
		props.inactive = {
			...props.previous,
			layouts: {
				scroll: {
					vertical: {
						offset: -60,
						contentSize: 1200,
						layoutSize: 800,
						isTouched: true,
					},
					horizontal: null,
				},
			},
		};

		const defaultTransform = buildZoomStyles({
			tag: "card",
			props,
			zoomOptions: { target: "bound" },
		}).content?.style?.transform as any[];
		const trackedTransform = buildZoomStyles({
			tag: "card",
			props,
			zoomOptions: {
				target: "bound",
				keepFocusedVisible: true,
			},
		}).content?.style?.transform as any[];

		expect(trackedTransform[1]?.translateY).toBeCloseTo(
			(defaultTransform[1]?.translateY as number) + 30,
			10,
		);
	});
});
