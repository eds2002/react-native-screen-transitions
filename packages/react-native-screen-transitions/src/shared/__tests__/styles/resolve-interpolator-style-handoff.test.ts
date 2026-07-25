import { describe, expect, it } from "bun:test";
import { resolveInterpolatorStyleHandoff } from "../../providers/screen/styles/helpers/resolve-interpolator-style-handoff";

describe("resolveInterpolatorStyleHandoff", () => {
	it("freezes a settled snap transform while the next interpolator animates", () => {
		const settledSheet = {
			content: {
				style: {
					transform: [{ translateY: 420 }],
				},
			},
		};
		const committed = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: true,
			currentStylesMap: settledSheet,
			nextStylesMap: undefined,
			frozenCurrentStylesMap: {},
		});

		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: false,
			currentStylesMap: {
				content: {
					style: {
						transform: [{ translateY: 0 }],
					},
				},
			},
			nextStylesMap: {
				content: {
					style: {
						transform: [{ scale: 0.8 }],
					},
				},
			},
			frozenCurrentStylesMap: committed.nextFrozenCurrentStylesMap,
		});

		expect(handoff.localStylesMaps).toEqual([
			{
				content: {
					style: {
						transform: [{ translateY: 420 }, { scale: 0.8 }],
					},
				},
			},
		]);
		expect(handoff.nextFrozenCurrentStylesMap).toBe(settledSheet);
	});

	it("freezes current values while live values override matching scalar keys", () => {
		const frozen = {
			content: {
				style: {
					opacity: 0.4,
					borderRadius: 24,
					transform: [{ translateY: 420 }],
				},
				props: {
					pointerEvents: "none" as const,
				},
			},
		};
		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: false,
			currentStylesMap: {
				content: {
					style: {
						opacity: 0,
						transform: [{ translateY: -420 }],
					},
				},
			},
			nextStylesMap: {
				content: {
					style: {
						opacity: 0.9,
						transform: [{ translateX: -120 }],
					},
					props: {
						pointerEvents: "box-none" as const,
					},
				},
			},
			frozenCurrentStylesMap: frozen,
		});

		expect(handoff.localStylesMaps[0]?.content).toEqual({
			style: {
				opacity: 0.9,
				borderRadius: 24,
				transform: [{ translateY: 420 }, { translateX: -120 }],
			},
			props: {
				pointerEvents: "box-none",
			},
		});
	});

	it("resumes the current interpolator and replaces the frozen snapshot", () => {
		const resumed = {
			content: {
				style: {
					transform: [{ translateY: 360 }],
				},
			},
		};
		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: true,
			currentStylesMap: resumed,
			nextStylesMap: {
				content: {
					style: {
						transform: [{ scale: 0.8 }],
					},
				},
			},
			frozenCurrentStylesMap: {
				content: {
					style: {
						transform: [{ translateY: 420 }],
					},
				},
			},
		});

		expect(handoff.localStylesMaps).toEqual([resumed]);
		expect(handoff.nextFrozenCurrentStylesMap).toBe(resumed);
	});

	it("keeps frozen values when the live interpolator returns undefined", () => {
		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: false,
			currentStylesMap: undefined,
			nextStylesMap: {
				content: {
					style: {
						opacity: undefined,
					},
					props: {
						pointerEvents: undefined,
					},
				},
			},
			frozenCurrentStylesMap: {
				content: {
					style: {
						opacity: 0.4,
					},
					props: {
						pointerEvents: "none",
					},
				},
			},
		});

		expect(handoff.localStylesMaps[0]?.content).toEqual({
			style: {
				opacity: 0.4,
			},
			props: {
				pointerEvents: "none",
			},
		});
	});
});
