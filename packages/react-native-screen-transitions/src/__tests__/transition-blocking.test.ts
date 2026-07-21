import { beforeEach, describe, expect, it } from "bun:test";
import { blockTransition, unblockTransition } from "../animation/transition-blocking";
import { HistoryStore } from "../stores/history.store";
import { SystemStore } from "../stores/system.store";
import type { BaseStackDescriptor } from "../types/stack.types";

const ROUTE_KEYS = ["route-a", "route-b", "route-explicit"];

const createDescriptor = (routeKey: string): BaseStackDescriptor =>
	({
		route: {
			key: routeKey,
			name: routeKey,
		},
	}) as BaseStackDescriptor;

beforeEach(() => {
	globalThis.resetMutableRegistry();
	HistoryStore._reset();

	for (const routeKey of ROUTE_KEYS) {
		SystemStore.clearBag(routeKey);
	}
});

describe("transition blocking", () => {
	it("reference-counts explicit route blocks", () => {
		const blockCount = SystemStore.getValue(
			"route-explicit",
			"pendingLifecycleStartBlockCount",
		);

		blockTransition("route-explicit");
		blockTransition("route-explicit");
		expect(blockCount.get()).toBe(2);

		unblockTransition("route-explicit");
		expect(blockCount.get()).toBe(1);

		unblockTransition("route-explicit");
		unblockTransition("route-explicit");
		expect(blockCount.get()).toBe(0);
	});

	it("keeps reference-count updates atomic when JS writes are deferred", () => {
		const blockCount = SystemStore.getValue(
			"route-explicit",
			"pendingLifecycleStartBlockCount",
		);
		const originalSet = blockCount.set.bind(blockCount);
		const deferredWrites: number[] = [];

		// Native SharedValue.set calls from JS are scheduled on the UI runtime. Model
		// that delay so sibling read-then-set updates would both enqueue the same value.
		blockCount.set = (value) => {
			deferredWrites.push(
				typeof value === "function" ? value(blockCount.get()) : value,
			);
		};

		blockTransition("route-explicit");
		blockTransition("route-explicit");

		for (const value of deferredWrites.splice(0)) {
			originalSet(value);
		}

		expect(blockCount.get()).toBe(2);

		unblockTransition("route-explicit");
		unblockTransition("route-explicit");

		for (const value of deferredWrites) {
			originalSet(value);
		}

		expect(blockCount.get()).toBe(0);
	});

	it("targets the most recently focused route when routeKey is omitted", () => {
		HistoryStore.focus(createDescriptor("route-a"), "navigator", "history-a");
		HistoryStore.focus(createDescriptor("route-b"), "navigator", "history-b");

		blockTransition();

		expect(
			SystemStore.getValue(
				"route-a",
				"pendingLifecycleStartBlockCount",
			).get(),
		).toBe(0);
		expect(
			SystemStore.getValue(
				"route-b",
				"pendingLifecycleStartBlockCount",
			).get(),
		).toBe(1);

		unblockTransition();
		expect(
			SystemStore.getValue(
				"route-b",
				"pendingLifecycleStartBlockCount",
			).get(),
		).toBe(0);
	});
});
