import { describe, expect, it, mock } from "bun:test";
import { createScreenTopology } from "../providers/screen/builder/topology/helpers/create-screen-topology";

describe("screen topology", () => {
	it("resolves current, ancestor, and active descendant screen keys", () => {
		const topology = createScreenTopology();
		topology.register({ screenKey: "root", navigatorKey: "root-stack" });
		topology.register({
			screenKey: "nested",
			navigatorKey: "nested-stack",
			parentScreenKey: "root",
		});
		topology.register({
			screenKey: "child",
			navigatorKey: "child-stack",
			parentScreenKey: "nested",
		});
		topology.activate({ parentScreenKey: "root", screenKey: "nested" });
		topology.activate({ parentScreenKey: "nested", screenKey: "child" });

		expect(topology.resolve("nested", -1)).toBe("root");
		expect(topology.resolve("nested", 0)).toBe("nested");
		expect(topology.resolve("nested", 1)).toBe("child");
		expect(topology.resolve("nested", 2)).toBeNull();
	});

	it("rejects duplicate mounted transition keys", () => {
		const topology = createScreenTopology();
		topology.register({
			screenKey: "feed-a",
			navigatorKey: "root-stack",
			transitionKey: "feed",
		});

		expect(() =>
			topology.register({
				screenKey: "feed-b",
				navigatorKey: "root-stack",
				transitionKey: "feed",
			}),
		).toThrow('Transition key "feed" is already registered');
	});

	it("resolves transition aliases to registered screen keys", () => {
		const topology = createScreenTopology();
		topology.register({
			screenKey: "feed-route",
			transitionKey: "feed",
		});

		expect(topology.resolveTransitionKey("feed")).toBe("feed-route");
		expect(topology.resolveTransitionKey("feed-route")).toBe("feed-route");

		topology.unregister("feed-route");
		expect(topology.resolveTransitionKey("feed")).toBeNull();
	});

	it("notifies key resolution subscribers when ownership changes", () => {
		const topology = createScreenTopology();
		const listener = mock(() => {});
		topology.register({ screenKey: "root", navigatorKey: "root-stack" });
		topology.register({
			screenKey: "first",
			navigatorKey: "nested-stack",
			parentScreenKey: "root",
		});
		topology.register({
			screenKey: "second",
			navigatorKey: "nested-stack",
			parentScreenKey: "root",
		});
		topology.activate({ parentScreenKey: "root", screenKey: "first" });
		const unsubscribe = topology.subscribeResolution(listener);

		topology.activate({ parentScreenKey: "root", screenKey: "second" });

		expect(listener).toHaveBeenCalledTimes(1);
		expect(topology.resolve("root", 1)).toBe("second");
		unsubscribe();
	});

	it("keeps a closing child active until it unmounts", () => {
		const topology = createScreenTopology();
		topology.register({ screenKey: "root", navigatorKey: "root-stack" });
		for (const screenKey of ["index", "child"]) {
			topology.register({
				screenKey,
				navigatorKey: "nested-stack",
				parentScreenKey: "root",
			});
		}
		topology.activate({ parentScreenKey: "root", screenKey: "index" });
		topology.activate({ parentScreenKey: "root", screenKey: "child" });

		// Navigation focuses index while child is still closing. Since index already
		// belongs to the active path, child remains authoritative until unmount.
		topology.activate({ parentScreenKey: "root", screenKey: "index" });
		expect(topology.resolve("root", 1)).toBe("child");

		topology.unregister("child");
		expect(topology.resolve("root", 1)).toBe("index");
	});

	it("supports children mounting before their parent", () => {
		const topology = createScreenTopology();
		topology.register({ screenKey: "child", parentScreenKey: "root" });
		topology.register({ screenKey: "root" });

		expect(topology.getRelationships("child").parentScreenKey).toBe("root");
	});

	it("unregisters by unique route key without losing a mounted sibling", () => {
		const topology = createScreenTopology();
		for (const screenKey of ["first", "second"]) {
			topology.register({ screenKey, parentScreenKey: "root" });
			topology.activate({ screenKey, parentScreenKey: "root" });
		}

		topology.unregister("second");
		expect(topology.getRelationships("root").activeChildScreenKey).toBe(
			"first",
		);
	});

	it("safely stores object-like screen keys", () => {
		const topology = createScreenTopology();
		topology.register({
			screenKey: "__proto__",
			parentScreenKey: "constructor",
		});

		expect(topology.getRelationships("__proto__").parentScreenKey).toBe(
			"constructor",
		);
	});

	it("notifies only relationship subscribers whose snapshot changes", () => {
		const topology = createScreenTopology();
		const rootListener = mock(() => {});
		const unrelatedListener = mock(() => {});
		topology.subscribe("root", rootListener);
		topology.subscribe("unrelated", unrelatedListener);

		topology.register({ screenKey: "child", parentScreenKey: "root" });
		topology.activate({ parentScreenKey: "root", screenKey: "child" });
		topology.register({
			screenKey: "other-child",
			parentScreenKey: "other-parent",
		});

		expect(rootListener).toHaveBeenCalledTimes(1);
		expect(unrelatedListener).not.toHaveBeenCalled();
	});
});
