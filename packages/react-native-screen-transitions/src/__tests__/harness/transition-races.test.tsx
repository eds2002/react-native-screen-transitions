import { afterEach, expect, it } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { MotionValues } from "../../providers/motion/types";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { useTransitionCompletion } = await import(
	"../../navigators/blank-stack/components/lifecycle/hooks/use-transition-completion"
);
const { useMotionValues } = await import("../../providers/motion/hooks/use-motion-values");
const { animateToProgress } = await import("../../utils/animation/animate-to-progress");

let renderer: ReactTestRenderer | undefined;

const mount = () => {
	let closes = 0;
	let motion: MotionValues | undefined;
	function Screen() {
		motion = useMotionValues();
		useTransitionCompletion({
			motion,
			onClose: () => {
				closes += 1;
			},
		});
		return null;
	}
	act(() => {
		renderer = create(<Screen />);
	});
	if (!motion) throw new Error("Motion was not mounted");

	const currentMotion = motion;
	currentMotion.transitionProgress.set(1);
	currentMotion.animationProgress.set(1);

	const request = (
		target: "open" | "close",
		duration: number,
		emitWillAnimate = false,
	) => {
		animateToProgress({
			target,
			spec: { open: { duration }, close: { duration } },
			animations: currentMotion,
			targetProgress: currentMotion.targetProgress,
			animationProgress: currentMotion.animationProgress,
			emitWillAnimate,
		});
	};
	return { request, motion, closes: () => closes };
};

afterEach(() => {
	act(() => {
		renderer?.unmount();
	});
	for (let i = 0; i < 12; i++) sim.frame();
	sim.flushRN();
});

it("ignores a deferred close superseded by an immediate open", () => {
	const screen = mount();
	screen.request("close", 0, true);
	screen.request("open", 0);
	sim.frame();
	sim.flushRN();

	expect(screen.motion.transitionProgress.get()).toBe(1);
	expect(screen.closes()).toBe(0);
});

it("ignores queued completion from the first close after close, open, close", () => {
	const screen = mount();
	screen.request("close", 0);
	sim.frame();

	screen.request("open", 0);
	sim.frame();
	screen.request("close", 100);

	sim.flushRN();
	expect(screen.closes()).toBe(0);

	for (let i = 0; i < 10; i++) sim.frame();
	sim.flushRN();
	expect(screen.closes()).toBe(1);
	sim.frame();
	sim.flushRN();
	expect(screen.closes()).toBe(1);
});

it("preserves the new animation flag when an earlier open clears it a frame late", () => {
	const screen = mount();
	screen.request("open", 0);
	sim.frame();
	screen.request("close", 100);
	sim.frame();

	expect(screen.motion.progressAnimating.get()).toBe(1);
	expect(screen.motion.transitionProgress.get()).toBeGreaterThan(0);
});

it("commits only the latest of two completed closes", () => {
	const screen = mount();
	screen.request("close", 0);
	sim.frame();
	screen.request("close", 0);
	sim.frame();

	sim.flushRN();
	expect(screen.closes()).toBe(1);
});

it("does not commit a close whose timing animation was cancelled", () => {
	const screen = mount();
	screen.request("close", 100);
	sim.frame();
	screen.motion.transitionProgress.set(0);
	sim.frame();

	sim.flushRN();
	expect(screen.closes()).toBe(0);
	expect(screen.motion.progressAnimating.get()).toBe(0);
});
