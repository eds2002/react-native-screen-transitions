import { describe, expect, it, mock } from "bun:test";
import { createReanimatedSim } from "./reanimated-sim";

const sim = createReanimatedSim({ frameMs: 1000 / 60 });
mock.module("react-native-reanimated", () => sim.reanimated);
mock.module("react-native-worklets", () => sim.worklets);

const { animate } = await import("../../utils/animation/animate");

const runUntilIdle = (limit = 600) => {
	const values: number[] = [];
	for (let i = 0; i < limit && !sim.isIdle(); i++) {
		sim.frame();
		values.push(sim.mutables.at(-1)?._value as number);
	}
	return values;
};

describe("reanimated sim", () => {
	it("runs the library spring frame by frame and calls back once when it finishes", () => {
		const progress = sim.reanimated.makeMutable(0);
		const results: unknown[] = [];
		progress.set(
			animate(1, { stiffness: 1000, damping: 500, mass: 3 }, (state) => results.push(state)),
		);
		// Assigned between frames: nothing moves until the next frame.
		expect(progress.get()).toBe(0);
		const values = runUntilIdle();
		expect(values.length).toBeGreaterThan(10);
		expect(values.at(-1)).toBe(1);
		for (let i = 1; i < values.length; i++) {
			expect(values[i]).toBeGreaterThanOrEqual(values[i - 1] - 1e-9);
		}
		expect(results.filter((r) => (r as { finished: boolean }).finished)).toHaveLength(1);
	});

	it("runs a timing for its duration", () => {
		const value = sim.reanimated.makeMutable(0);
		value.set(sim.reanimated.withTiming(100, { duration: 500 }));
		const values = runUntilIdle();
		// 500 ms at 60 Hz: the frame at or after 500 ms finishes it.
		expect(values.length).toBe(31);
		expect(values.at(-1)).toBe(100);
	});

	it("reports an interrupted animation as unfinished and starts the new one from where it was", () => {
		const value = sim.reanimated.makeMutable(0);
		const calls: Array<boolean | undefined> = [];
		value.set(sim.reanimated.withTiming(100, { duration: 1000 }, (f) => calls.push(f)));
		for (let i = 0; i < 10; i++) sim.frame();
		const mid = value.get();
		expect(mid).toBeGreaterThan(0);
		expect(mid).toBeLessThan(100);
		value.set(sim.reanimated.withTiming(0, { duration: 200 }));
		sim.frame();
		expect(calls).toEqual([false]);
		expect(value.get()).toBe(mid);
		runUntilIdle();
		expect(value.get()).toBe(0);
	});

	it("holds a delayed animation, then runs it", () => {
		const value = sim.reanimated.makeMutable(0);
		value.set(sim.reanimated.withDelay(100, sim.reanimated.withTiming(1, { duration: 100 })));
		for (let i = 0; i < 6; i++) sim.frame();
		expect(value.get()).toBe(0);
		runUntilIdle();
		expect(value.get()).toBe(1);
	});

	it("queues JS-thread work until it is flushed", () => {
		const seen: number[] = [];
		sim.worklets.scheduleOnRN((n: number) => seen.push(n), 1);
		expect(seen).toEqual([]);
		expect(sim.flushRN()).toBe(1);
		expect(seen).toEqual([1]);
	});
});
