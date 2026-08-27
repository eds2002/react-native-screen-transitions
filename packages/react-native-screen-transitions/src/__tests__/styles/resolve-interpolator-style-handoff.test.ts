import { describe, expect, it } from "bun:test";
import { resolveInterpolatorStyleHandoff } from "../../providers/screen/styles/helpers/resolve-interpolator-style-handoff";

describe("resolveInterpolatorStyleHandoff", () => {
	it("composes a settled current transform while the next interpolator animates", () => {
		const settledSheet = {
			content: {
				style: {
					transform: [{ translateY: 420 }],
				},
			},
		};
		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: false,
			currentStylesMap: settledSheet,
			nextStylesMap: {
				content: {
					style: {
						transform: [{ scale: 0.8 }],
					},
				},
			},
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
	});

	it("keeps current values while next values override matching scalar keys", () => {
		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: false,
			currentStylesMap: {
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

	it("keeps the current screen progressing during an overlapping push", () => {
		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: false,
			currentStylesMap: {
				content: {
					style: {
						transform: [{ translateY: 200 }],
					},
				},
			},
			nextStylesMap: {
				content: {
					style: {
						transform: [{ translateX: -120 }],
					},
				},
			},
		});

		expect(handoff.localStylesMaps).toEqual([
			{
				content: {
					style: {
						transform: [{ translateY: 200 }, { translateX: -120 }],
					},
				},
			},
		]);
	});

	it("uses only current styles while the current interpolator owns the screen", () => {
		const current = {
			content: {
				style: {
					transform: [{ translateY: 360 }],
				},
			},
		};
		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: true,
			currentStylesMap: current,
			nextStylesMap: {
				content: {
					style: {
						transform: [{ scale: 0.8 }],
					},
				},
			},
		});

		expect(handoff.localStylesMaps).toEqual([current]);
	});

	it("uses next styles when the current interpolator returns undefined", () => {
		const next = {
			content: {
				style: {
					opacity: 0.9,
				},
				props: {
					pointerEvents: "box-none" as const,
				},
			},
		};
		const handoff = resolveInterpolatorStyleHandoff({
			currentOwnsInterpolator: false,
			currentStylesMap: undefined,
			nextStylesMap: next,
		});

		expect(handoff.localStylesMaps).toEqual([next]);
	});
});
