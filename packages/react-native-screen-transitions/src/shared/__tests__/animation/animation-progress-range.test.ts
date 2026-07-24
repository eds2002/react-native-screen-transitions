import { expect, test } from "bun:test";
import { resolveAnimationProgressRange } from "../../utils/animation/animate-to-progress";

test("keeps linear progress continuous when a closing screen reopens", () => {
	expect(resolveAnimationProgressRange(0.45, 1)).toEqual({
		from: 0.45,
		to: 1,
	});
});
