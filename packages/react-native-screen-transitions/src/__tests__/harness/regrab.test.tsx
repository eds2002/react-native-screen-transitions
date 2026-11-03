import { expect, it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { runScenario } = await import("./scenario");
const { sequences } = await import("./catalog");
const { interpolate } = await import("react-native-reanimated");
const { DraggableCard } = await import("../../configs/presets");

/**
 * Grabbing a screen again while it springs back from a cancelled swipe must continue from where it is
 * on screen. Two paths carry the spring-back: the progress delta (interpolators driven by progress) and
 * the gesture values (interpolators that move with gesture.normX/normY, like DraggableCard). A new drag
 * used to clear both, so the screen jumped to its resting pose and tracked the finger from there.
 */

const SPRING = { stiffness: 1000, damping: 500, mass: 3, overshootClamping: false, restSpeedThreshold: 0.02 };
const slide = {
	gestureEnabled: true,
	gestureDirection: "horizontal",
	transitionSpec: { open: SPRING, close: SPRING },
	screenStyleInterpolator: ({ progress, layouts: { screen } }: any) => {
		"worklet";
		return { content: { style: { transform: [{ translateX: interpolate(progress, [0, 1, 2], [screen.width, 0, -screen.width * 0.3]) }] } } };
	},
};

const regrab = sequences["regrab-spring-back"]("horizontal")!;
// Grab again at several points of the spring-back: early (far from rest) to late.
const delays = [1, 4, 8];

for (const [name, screenOptions] of [
	["slide (progress)", slide],
	["DraggableCard (gesture values)", DraggableCard()],
] as const) {
	for (const frames of delays) {
		it(`${name}: re-grab ${frames} frames into the spring-back continues from the screen's position`, async () => {
			const steps = regrab.map((step) => (step.op === "frames" ? { ...step, count: frames } : step));
			const result = await runScenario(sim, {
				name: `regrab / ${name} / ${frames}`,
				screens: [{ name: "A" }, { name: "B" }],
				screenOptions,
				steps,
				expect: { mayOvershoot: true },
			});
			expect(result.violations).toEqual([]);
		});
	}
}
