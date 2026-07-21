import { describe, expect, it } from "bun:test";
import { resolveDismissScaleHandoff } from "../../utils/bounds/navigation/reveal/math";

describe("dismiss scale handoff", () => {
	it("uses the configured ease-in when restoring the release scale", () => {
		const scale = resolveDismissScaleHandoff({
			progress: 0.5,
			releaseScale: 0.5,
			targetScale: 1,
			velocity: 0,
			velocityDepth: 0,
		});

		expect(scale).toBeCloseTo(0.5428932188, 6);
		expect(scale).toBeLessThan(0.75);
	});

	it("preserves both scale endpoints", () => {
		expect(
			resolveDismissScaleHandoff({
				progress: 1,
				releaseScale: 0.5,
				targetScale: 1,
				velocity: 0,
				velocityDepth: 0,
			}),
		).toBe(0.5);

		expect(
			resolveDismissScaleHandoff({
				progress: 0,
				releaseScale: 0.5,
				targetScale: 1,
				velocity: 0,
				velocityDepth: 0,
			}),
		).toBeCloseTo(1, 10);
	});
});
