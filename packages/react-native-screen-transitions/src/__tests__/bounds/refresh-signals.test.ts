import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { getRefreshBoundarySignal } from "../../components/boundary/utils/refresh-signals";
import { applyMeasuredBoundsWrites } from "../../providers/helpers/measured-bounds-writes";
import { startPanBase } from "../../providers/screen/gestures/pan/behavior/pan-lifecycle";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import { pairs } from "../../stores/bounds/internals/state";
import { GestureStore } from "../../stores/gesture.store";
import { SystemStore } from "../../stores/system.store";

const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

beforeEach(() => {
	pairs.set({});
	globalThis.requestAnimationFrame = (() => 1) as typeof requestAnimationFrame;
});

afterEach(() => {
	if (originalRequestAnimationFrame) {
		globalThis.requestAnimationFrame = originalRequestAnimationFrame;
		return;
	}

	Reflect.deleteProperty(globalThis, "requestAnimationFrame");
});

describe("refresh boundary signals", () => {
	it("keeps destination refreshes for close retargeting", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		expect(
			getRefreshBoundarySignal({
				enabled: true,
				currentScreenKey: "screen-b",
				destinationPairKey: pairKey,
				linkId: "card",
				shouldRefresh: true,
				closing: true,
			}),
		).toEqual({
			type: "destination",
			pairKey,
			signal: "destination|screen-a<>screen-b|screen-b|closing",
		});
	});

	it("refreshes the active grouped source before an interactive close", () => {
		const pairKey = createScreenPairKey("palette", "detail");

		expect(
			getRefreshBoundarySignal({
				enabled: true,
				currentScreenKey: "detail",
				sourcePairKey: pairKey,
				linkId: "hot-coral",
				group: "colors",
				shouldRefresh: true,
				closing: false,
				linkState: {
					[pairKey]: {
						links: {},
						groups: {
							colors: {
								activeId: "hot-coral",
								initialId: "electric-violet",
							},
						},
					},
				},
			}),
		).toEqual({
			type: "source",
			pairKey,
			signal: `source|${pairKey}|colors|hot-coral|settled`,
		});
	});

	it("refreshes and resolves the active group member at the interactive-dismiss pulse", () => {
		const pairKey = createScreenPairKey("palette", "detail");
		const routeKey = "detail-boundary-refresh";
		const animations = AnimationStore.getBag(routeKey);
		const gestures = GestureStore.getBag(routeKey);
		const system = SystemStore.getBag(routeKey);
		const runtime = {
			participation: { canDismiss: true, effectiveSnapPoints: {} },
			policy: { gestureReleaseVelocityScale: 1 },
			stores: { animations, gestures, system },
		};
		const electricViolet = {
			x: 24,
			y: 48,
			pageX: 24,
			pageY: 48,
			width: 80,
			height: 80,
		};
		const hotCoral = {
			x: 132,
			y: 216,
			pageX: 132,
			pageY: 216,
			width: 80,
			height: 80,
		};

		try {
			BoundStore.link.setSource(
				pairKey,
				"electric-violet",
				"palette",
				electricViolet,
				{},
				"colors",
			);
			BoundStore.link.setActiveGroupId(
				pairKey,
				"colors",
				"electric-violet",
			);
			BoundStore.link.setActiveGroupId(pairKey, "colors", "hot-coral");

			expect(
				BoundStore.link.getPair("colors:hot-coral", {
					entering: false,
					currentScreenKey: "palette",
					nextScreenKey: "detail",
				}).sourceBounds,
			).toEqual(electricViolet);

			gestures.active.set("vertical");
			startPanBase(runtime as any);

			const signal = getRefreshBoundarySignal({
				enabled: true,
				currentScreenKey: "palette",
				nextScreenKey: routeKey,
				sourcePairKey: pairKey,
				linkId: "hot-coral",
				group: "colors",
				shouldRefresh: animations.willAnimate.get() === 1,
				closing: false,
				linkState: pairs.get(),
			});

			expect(signal).toEqual({
				type: "source",
				pairKey,
				signal: `source|${pairKey}|colors|hot-coral|settled`,
			});

			if (!signal) {
				throw new Error("Expected a source refresh signal for Hot Coral");
			}

			applyMeasuredBoundsWrites({
				entryTag: "colors:hot-coral",
				linkId: "hot-coral",
				group: "colors",
				currentScreenKey: "palette",
				measured: hotCoral,
				preparedStyles: {},
				linkWrite: signal,
			});

			expect(
				BoundStore.link.getPair("colors:hot-coral", {
					entering: false,
					currentScreenKey: "palette",
					nextScreenKey: "detail",
				}).sourceBounds,
			).toEqual(hotCoral);
		} finally {
			AnimationStore.clearBag(routeKey);
			GestureStore.clearBag(routeKey);
			SystemStore.clearBag(routeKey);
		}
	});
});
