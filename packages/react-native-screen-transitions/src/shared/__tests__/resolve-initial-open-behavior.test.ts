import { describe, expect, it } from "bun:test";
import { resolveInitialOpenBehavior } from "../components/screen-lifecycle/hooks/helpers/resolve-initial-open-behavior";

describe("resolveInitialOpenBehavior", () => {
	it("keeps the first screen settled by default", () => {
		const resolved = resolveInitialOpenBehavior({
			isFirstKey: true,
			options: {},
		});

		expect(resolved).toEqual({
			kind: "set",
			target: 1,
		});
	});

	it("animates the first screen when explicitly enabled", () => {
		const resolved = resolveInitialOpenBehavior({
			isFirstKey: true,
			options: {
				experimental_animateOnInitialMount: true,
			},
		});

		expect(resolved).toEqual({
			kind: "animate",
			target: "open",
		});
	});

	it("defers auto snap points on the first screen without animating by default", () => {
		const resolved = resolveInitialOpenBehavior({
			isFirstKey: true,
			options: {
				snapPoints: ["auto"],
			},
		});

		expect(resolved).toEqual({
			kind: "defer",
			shouldAnimateAfterMeasurement: false,
		});
	});

	it("animates deferred auto snap points on the first screen when enabled", () => {
		const resolved = resolveInitialOpenBehavior({
			isFirstKey: true,
			options: {
				snapPoints: ["auto"],
				experimental_animateOnInitialMount: true,
			},
		});

		expect(resolved).toEqual({
			kind: "defer",
			shouldAnimateAfterMeasurement: true,
		});
	});

	it("preserves existing non-first auto snap behavior", () => {
		const resolved = resolveInitialOpenBehavior({
			isFirstKey: false,
			options: {
				snapPoints: ["auto"],
			},
		});

		expect(resolved).toEqual({
			kind: "defer",
			shouldAnimateAfterMeasurement: true,
		});
	});
});
