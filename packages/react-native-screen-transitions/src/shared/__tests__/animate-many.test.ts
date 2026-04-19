import { describe, expect, it } from "bun:test";
import { animateMany } from "../utils/animation/animate-many";

const createShared = (value = 0) => ({ value });

describe("animateMany", () => {
	it("calls onAllFinished once when all animations finish true", () => {
		let finishedCount = 0;

		animateMany({
			items: [
				{ value: createShared() as any, toValue: 1, config: { duration: 200 } as any },
				{ value: createShared() as any, toValue: 2, config: { damping: 20 } as any },
				{ value: createShared() as any, toValue: 3, config: { duration: 150 } as any },
			],
			onAllFinished: () => {
				finishedCount += 1;
			},
		});

		expect(finishedCount).toBe(1);
	});

	it("does not call onAllFinished if one animation reports false", () => {
		let finishedCount = 0;

		animateMany({
			items: [
				{ value: createShared() as any, toValue: 1, config: { duration: 200 } as any },
				{
					value: createShared() as any,
					toValue: 2,
					config: { duration: 200, __finished: false } as any,
				},
			],
			onAllFinished: () => {
				finishedCount += 1;
			},
		});

		expect(finishedCount).toBe(0);
	});

	it("fires immediately for empty items", () => {
		let finishedCount = 0;

		animateMany({
			items: [],
			onAllFinished: () => {
				finishedCount += 1;
			},
		});

		expect(finishedCount).toBe(1);
	});

	it("applies toValue and config for each item", () => {
		const a = createShared(5);
		const b = createShared(7);
		const cfgA = { duration: 220 };
		const cfgB = { damping: 18 };

		animateMany({
			items: [
				{ value: a as any, toValue: 1, config: cfgA as any },
				{ value: b as any, toValue: 0, config: cfgB as any },
			],
		});

		expect(a.value).toBe(1);
		expect(b.value).toBe(0);
	});
});
