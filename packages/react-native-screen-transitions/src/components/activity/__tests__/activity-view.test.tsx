import { describe, expect, it } from "bun:test";
import React, { useEffect, useState, useSyncExternalStore } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { ActivityView } from "../activity-view";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("ActivityView", () => {
	it("controls presentation independently from paused lifecycle work", () => {
		let renderer!: ReactTestRenderer;
		act(() => {
			renderer = create(
				<ActivityView mode="paused" visible>
					paused content
				</ActivityView>,
			);
		});

		expect(
			renderer.root.findByType("ScreenTransitionsActivityPaintView").props
				.style,
		).toEqual({ display: "contents" });

		act(() => {
			renderer.update(
				<ActivityView mode="paused" visible={false}>
					paused content
				</ActivityView>,
			);
		});

		expect(
			renderer.root.findByType("ScreenTransitionsActivityPaintView").props
				.style,
		).toEqual({ display: "none" });
	});

	it("pauses effects while preserving state and the mounted subtree", () => {
		const lifecycle: string[] = [];
		let setCount: React.Dispatch<React.SetStateAction<number>> = () => {};

		function Probe() {
			const [count, updateCount] = useState(0);
			setCount = updateCount;

			useEffect(() => {
				lifecycle.push(`mount:${count}`);
				return () => lifecycle.push(`cleanup:${count}`);
			}, []);

			return <>{count}</>;
		}

		let renderer!: ReactTestRenderer;
		act(() => {
			renderer = create(
				<ActivityView mode="normal" visible>
					<Probe />
				</ActivityView>,
			);
		});

		act(() => setCount(1));
		act(() => {
			renderer.update(
				<ActivityView mode="paused" visible>
					<Probe />
				</ActivityView>,
			);
		});
		expect(lifecycle).toEqual(["mount:0", "cleanup:0"]);

		act(() => {
			renderer.update(
				<ActivityView mode="normal" visible>
					<Probe />
				</ActivityView>,
			);
		});
		expect(lifecycle).toEqual(["mount:0", "cleanup:0", "mount:1"]);
	});

	it("disconnects stores while paused and catches up on resume", () => {
		let snapshot = 0;
		const listeners = new Set<() => void>();
		const renders: number[] = [];
		const store = {
			getSnapshot: () => snapshot,
			subscribe: (listener: () => void) => {
				listeners.add(listener);
				return () => listeners.delete(listener);
			},
		};

		function StoreProbe() {
			const value = useSyncExternalStore(
				store.subscribe,
				store.getSnapshot,
				store.getSnapshot,
			);
			renders.push(value);
			return <>{value}</>;
		}

		let renderer!: ReactTestRenderer;
		act(() => {
			renderer = create(
				<ActivityView mode="normal" visible>
					<StoreProbe />
				</ActivityView>,
			);
		});
		expect(listeners.size).toBe(1);

		act(() => {
			renderer.update(
				<ActivityView mode="paused" visible={false}>
					<StoreProbe />
				</ActivityView>,
			);
		});
		expect(listeners.size).toBe(0);
		const rendersAfterPause = [...renders];

		act(() => {
			snapshot = 1;
			for (const listener of listeners) listener();
		});
		expect(renders).toEqual(rendersAfterPause);

		act(() => {
			renderer.update(
				<ActivityView mode="normal" visible>
					<StoreProbe />
				</ActivityView>,
			);
		});
		expect(listeners.size).toBe(1);
		expect(renders.at(-1)).toBe(1);
	});
});
