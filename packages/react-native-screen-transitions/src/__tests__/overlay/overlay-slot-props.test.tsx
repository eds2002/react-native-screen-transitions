import { describe, expect, it } from "bun:test";
import { type ReactNode } from "react";
import { act, create } from "react-test-renderer";
import { useOverlaySlot } from "../../components/overlay/hooks/use-overlay-slot";
import type { ScreenAnimationContextValue } from "../../providers/screen/animation/animation.provider";
import type { ScreenInterpolatorFrame } from "../../providers/screen/animation/helpers/pipeline";

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
	} as unknown as ScreenAnimationContextValue;
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
				interpolatorReady: shared(1) as never,
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
});
