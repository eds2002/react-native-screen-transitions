import { describe, expect, it } from "bun:test";
import { type ReactNode } from "react";
import { act, create } from "react-test-renderer";
import { useOverlaySlot } from "../../components/overlay/hooks/use-overlay-slot";
import type { OrchestratorState } from "../../providers/screen/orchestrator/orchestrator.provider";
import type { ScreenInterpolatorFrame } from "../../providers/screen/orchestrator/helpers/pipeline";
import { getVisibilityBlockOffset } from "../../utils/visibility-block-offset";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
	true;

const shared = <T,>(value: T) => ({
	value,
	get: () => value,
	set: () => {},
	modify: () => {},
});

const createFrame = (key: string) =>
	({
		current: {
			gesture: { dismissing: 0, dragging: 0, settling: 0 },
			layouts: { screen: { height: 844, width: 390 } },
			progress: 1,
			route: { key, name: key },
			settled: 1,
			transitionProgress: 1,
		},
		insets: { bottom: 0, left: 0, right: 0, top: 0 },
		stackProgress: 1,
	}) as ScreenInterpolatorFrame;

const createAnimationStore = (key: string) => {
	const screenInterpolatorProps = shared(createFrame(key));

	return {
		screenKey: key,
		screenInterpolatorProps,
	} as unknown as OrchestratorState;
};

describe("overlay slot props", () => {
	it("forwards pointer events and strips internal handoff ownership", () => {
		const store = createAnimationStore("A");
		let animatedProps: Record<string, unknown> | undefined;

		function Probe(): ReactNode {
			animatedProps = useOverlaySlot({
				driverAnimationStore: store,
				driverInterpolator: () => {
					"worklet";
					return {
						overlay: {
							props: {
								handoffTarget: "source",
								pointerEvents: "none",
								testID: "overlay",
							},
						},
					};
				},
				isScreenReady: shared(true) as never,
				ancestorIsScreenReady: null,
				isIncoming: false,
				overlayAnimationStore: store,
				overlayInterpolator: undefined,
			}).animatedProps;

			return null;
		}

		act(() => {
			create(<Probe />);
		});

		expect(animatedProps).toEqual({
			pointerEvents: "none",
			testID: "overlay",
		});
	});

	it.each([
		{ ready: false, ancestorReady: null, offset: true },
		{ ready: false, ancestorReady: true, offset: true },
		{ ready: false, ancestorReady: false, offset: false },
		{ ready: true, ancestorReady: true, offset: false },
	])("offsets an incoming overlay once: %j", ({
		ready,
		ancestorReady,
		offset,
	}) => {
		const store = createAnimationStore("A");
		let animatedStyle: unknown;
		function Probe() {
			animatedStyle = useOverlaySlot({
				driverAnimationStore: store,
				driverInterpolator: () => ({ overlay: { style: { opacity: 0.5 } } }),
				isScreenReady: shared(ready) as never,
				ancestorIsScreenReady:
					ancestorReady === null ? null : (shared(ancestorReady) as never),
				isIncoming: true,
				overlayAnimationStore: store,
				overlayInterpolator: undefined,
			}).animatedStyle;
			return null;
		}
		let renderer: ReturnType<typeof create>;
		act(() => {
			renderer = create(<Probe />);
		});
		expect(animatedStyle).toEqual(
			offset
				? { transform: [{ translateY: getVisibilityBlockOffset(844) }] }
				: { opacity: 0.5 },
		);
		act(() => {
			renderer.unmount();
		});
	});
});
