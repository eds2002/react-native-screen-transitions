import { expect, it } from "bun:test";
import { installHarness } from "./install";

const sim = installHarness();
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { runScenario } = await import("./scenario");
const { transitions } = await import("./catalog");
const { interpolate } = await import("react-native-reanimated");

/**
 * Pushing C while B is still sliding in: B keeps moving the same way. B's style is composed from its
 * own interpolator (its entry) and C's (being covered); C's used to see B's unfinished entry as well,
 * so B jumped back ~75-100 pt on the frame C landed, then raced forward.
 */
for (const axis of ["horizontal", "vertical"] as const) {
	for (const gap of [3, 6, 10]) {
		it(`slide-${axis}: B keeps moving forward when C is pushed ${gap} frames into its push`, async () => {
			const { options } = transitions({} as never)[`slide-${axis}`](interpolate as never);
			const result = await runScenario(sim, {
				name: `push-during-push / ${axis} / ${gap}`,
				screens: [{ name: "A" }, { name: "B" }, { name: "C" }],
				screenOptions: options,
				steps: [{ op: "push", name: "B" }, { op: "frames", count: gap }, { op: "push", name: "C" }, { op: "settle" }],
				expect: {},
			});
			expect(result.violations).toEqual([]);
			const position = result.trace
				.map((frame) => frame.scenes.find((scene) => scene.name === "B")?.rect)
				.filter((rect): rect is NonNullable<typeof rect> => !!rect)
				.map((rect) => (axis === "horizontal" ? rect.x : rect.y));
			// B only ever moves towards (and past, under C) its open position: never back.
			for (let i = 1; i < position.length; i++) {
				expect(position[i]).toBeLessThanOrEqual(position[i - 1] + 0.5);
			}
		});
	}
}
