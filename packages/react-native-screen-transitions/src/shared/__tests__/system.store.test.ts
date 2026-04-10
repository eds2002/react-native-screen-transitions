import { beforeEach, describe, expect, it } from "bun:test";
import {
	LifecycleTransitionRequestKind,
	SystemStore,
} from "../stores/system.store";

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("SystemStore", () => {
	it("returns a stable bag for the same route key", () => {
		const first = SystemStore.getBag("route-a");
		const second = SystemStore.getBag("route-a");

		expect(second).toBe(first);
	});

	it("returns typed values for internal runtime fields", () => {
		const targetProgress = SystemStore.getValue("route-a", "targetProgress");
		const resolvedAutoSnapPoint = SystemStore.getValue(
			"route-a",
			"resolvedAutoSnapPoint",
		);
		const measuredContentLayout = SystemStore.getValue(
			"route-a",
			"measuredContentLayout",
		);

		expect(targetProgress.value).toBe(1);
		expect(resolvedAutoSnapPoint.value).toBe(-1);
		expect(measuredContentLayout.value).toBeNull();
	});

	it("recreates a fresh bag after clearBag", () => {
		const first = SystemStore.getBag("route-a");

		SystemStore.clearBag("route-a");

		const second = SystemStore.getBag("route-a");
		expect(second).not.toBe(first);
	});

	it("exposes lifecycle helpers on the store object", () => {
		const bag = SystemStore.getBag("route-a");

		bag.requestLifecycleTransition(LifecycleTransitionRequestKind.Open, 0.4);

		expect(bag.pendingLifecycleRequestId.get()).toBe(1);
		expect(bag.pendingLifecycleRequestKind.get()).toBe(
			LifecycleTransitionRequestKind.Open,
		);
		expect(bag.pendingLifecycleRequestTarget.get()).toBe(0.4);

		bag.clearLifecycleTransitionRequest(1);

		expect(bag.pendingLifecycleRequestKind.get()).toBe(
			LifecycleTransitionRequestKind.None,
		);
		expect(bag.pendingLifecycleRequestTarget.get()).toBe(0);
	});
});
