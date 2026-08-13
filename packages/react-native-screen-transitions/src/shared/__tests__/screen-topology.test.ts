import { describe, expect, it, mock } from "bun:test";
import { createScreenTopology } from "../factories/screen-topology";

describe("screen topology", () => {
	it("owns direct parent and active-child relationships", () => {
		const topology = createScreenTopology();

		topology.register({
			screenKey: "root",
		});
		topology.register({
			screenKey: "nested",
			parentScreenKey: "root",
		});
		topology.register({
			screenKey: "leaf",
			parentScreenKey: "nested",
		});

		expect(topology.getRelationships("root")).toEqual({
			parentScreenKey: null,
			activeChildScreenKey: null,
		});
		expect(topology.getRelationships("nested")).toEqual({
			parentScreenKey: "root",
			activeChildScreenKey: null,
		});
		expect(topology.getRelationships("leaf")).toEqual({
			parentScreenKey: "nested",
			activeChildScreenKey: null,
		});
	});

	it("supports children mounting before their parent", () => {
		const topology = createScreenTopology();

		topology.register({
			screenKey: "child",
			parentScreenKey: "root",
		});
		topology.register({
			screenKey: "root",
		});

		expect(topology.getRelationships("child").parentScreenKey).toBe("root");
	});

	it("reparents and unregisters by unique route key", () => {
		const topology = createScreenTopology();

		topology.register({
			screenKey: "child",
			parentScreenKey: "old-parent",
		});
		topology.activate({
			screenKey: "child",
			parentScreenKey: "old-parent",
		});
		topology.register({
			screenKey: "child",
			parentScreenKey: "current-parent",
		});

		expect(topology.getRelationships("child").parentScreenKey).toBe(
			"current-parent",
		);
		expect(topology.getRelationships("old-parent").activeChildScreenKey).toBeNull();

		topology.unregister("child");
		expect(topology.getRelationships("child").parentScreenKey).toBeNull();
	});

	it("rejects cycles and safely stores object-like screen keys", () => {
		const topology = createScreenTopology();

		topology.register({
			screenKey: "__proto__",
			parentScreenKey: "constructor",
		});
		expect(topology.getRelationships("__proto__").parentScreenKey).toBe(
			"constructor",
		);

		expect(() =>
			topology.register({
				screenKey: "constructor",
				parentScreenKey: "__proto__",
			}),
		).toThrow("Screen topology cannot register a cyclic parent edge.");
	});

	it("models the active nested path without losing a mounted sibling", () => {
		const topology = createScreenTopology();

		for (const [screenKey, parentScreenKey] of [
			["child-a", "root"],
			["child-b", "root"],
			["grandchild", "child-b"],
		] as const) {
			topology.register({
				screenKey,
				parentScreenKey,
			});
		}

		const clearA = topology.activate({
			parentScreenKey: "root",
			screenKey: "child-a",
		});
		const clearB = topology.activate({
			parentScreenKey: "root",
			screenKey: "child-b",
		});
		topology.activate({
			parentScreenKey: "child-b",
			screenKey: "grandchild",
		});

		expect(topology.getRelationships("root").activeChildScreenKey).toBe(
			"child-b",
		);
		expect(topology.getRelationships("child-b").activeChildScreenKey).toBe(
			"grandchild",
		);

		clearB();
		expect(topology.getRelationships("root").activeChildScreenKey).toBe(
			"child-a",
		);

		clearA();
		expect(topology.getRelationships("root").activeChildScreenKey).toBeNull();
	});

	it("does not invalidate ancestors when only a direct child changes", () => {
		const topology = createScreenTopology();
		const rootListener = mock(() => {});
		const childListener = mock(() => {});

		topology.register({ screenKey: "child", parentScreenKey: "root" });
		topology.register({ screenKey: "grandchild", parentScreenKey: "child" });
		topology.activate({ screenKey: "child", parentScreenKey: "root" });
		topology.subscribe("root", rootListener);
		topology.subscribe("child", childListener);

		topology.activate({ screenKey: "grandchild", parentScreenKey: "child" });

		expect(rootListener).not.toHaveBeenCalled();
		expect(childListener).toHaveBeenCalledTimes(1);
	});

	it("keeps a registered relationship snapshot stable across subscriptions", () => {
		const topology = createScreenTopology();
		topology.register({ screenKey: "child", parentScreenKey: "root" });
		const relationships = topology.getRelationships("child");

		const unsubscribe = topology.subscribe("child", () => {});
		unsubscribe();

		expect(topology.getRelationships("child")).toBe(relationships);
	});

	it("notifies only subscribers whose relationship snapshot changed", () => {
		const topology = createScreenTopology();
		const rootListener = mock(() => {});
		const unrelatedListener = mock(() => {});
		const unsubscribeRoot = topology.subscribe("root", rootListener);
		const unsubscribeUnrelated = topology.subscribe(
			"unrelated",
			unrelatedListener,
		);

		topology.register({
			screenKey: "child",
			parentScreenKey: "root",
		});
		topology.activate({
			parentScreenKey: "root",
			screenKey: "child",
		});
		const rootRelationships = topology.getRelationships("root");

		topology.register({
			screenKey: "other-child",
			parentScreenKey: "other-parent",
		});

		expect(rootListener).toHaveBeenCalledTimes(1);
		expect(unrelatedListener).not.toHaveBeenCalled();
		expect(topology.getRelationships("root")).toBe(rootRelationships);

		unsubscribeRoot();
		unsubscribeUnrelated();
	});
});
