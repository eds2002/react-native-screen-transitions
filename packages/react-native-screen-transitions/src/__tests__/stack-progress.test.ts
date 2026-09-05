import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import { readStackProgress } from "../providers/screen/orchestrator/helpers/stack-progress";

const tracked = (value: number) => {
	let reads = 0;

	return {
		progress: {
			get: () => {
				reads += 1;
				return value;
			},
		} as SharedValue<number>,
		getReads: () => reads,
	};
};

describe("stack progress", () => {
	it("accumulates only the requested route suffix", () => {
		const first = tracked(1);
		const second = tracked(0.75);
		const top = tracked(0.5);
		const entries = [
			{ routeKey: "A", visualProgress: first.progress },
			{ routeKey: "B", visualProgress: second.progress },
			{ routeKey: "C", visualProgress: top.progress },
		];

		expect(readStackProgress(entries, "B", 0)).toBe(1.25);
		expect(first.getReads()).toBe(0);
		expect(second.getReads()).toBe(1);
		expect(top.getReads()).toBe(1);
	});

	it("reads only the top route for a top-screen consumer", () => {
		const first = tracked(1);
		const second = tracked(1);
		const top = tracked(0.4);
		const entries = [
			{ routeKey: "A", visualProgress: first.progress },
			{ routeKey: "B", visualProgress: second.progress },
			{ routeKey: "C", visualProgress: top.progress },
		];

		expect(readStackProgress(entries, "C", 0)).toBe(0.4);
		expect(first.getReads()).toBe(0);
		expect(second.getReads()).toBe(0);
		expect(top.getReads()).toBe(1);
	});

	it("falls back to local frame progress after structural removal", () => {
		const top = tracked(0.5);

		expect(
			readStackProgress(
				[{ routeKey: "B", visualProgress: top.progress }],
				"A",
				0.75,
			),
		).toBe(0.75);
	});
});
