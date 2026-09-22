import { createModuleMock } from "../helpers/mock-module";
import { afterEach, expect, it } from "bun:test";

// Exercise the exact snapshots React compares without mounting native views.
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("react", () => ({
	useSyncExternalStore: (_subscribe: unknown, getSnapshot: () => unknown) => getSnapshot(),
}));
const { mountPortalBoundaryHost: mount, unmountPortalBoundaryHostByName: unmount, useActivePortalBoundaryHosts: read } = await import("../../components/boundary/portal/stores/portal-boundary-host.store");
import type { ActivePortalBoundaryHost } from "../../components/boundary/portal/stores/portal-boundary-host.store";

const host = (name: string, scope: string) => ({
	boundaryId: name,
	portalHostName: name,
	hostKey: scope,
	localMeasurement: {},
	portalHostReady: {},
	slotsMap: {},
}) as ActivePortalBoundaryHost;

afterEach(() => { unmount("a"); unmount("b"); });

it("preserves another overlay's snapshot on mount and unmount", () => {
	mount(host("a", "first"));
	const first = read("first");
	mount(host("b", "second"));
	expect(read("first")).toBe(first);
	unmount("b");
	expect(read("first")).toBe(first);
});

it("updates both scopes when a receiver moves", () => {
	const receiver = host("a", "first");
	mount(receiver);
	const first = read("first");
	mount({ ...receiver, hostKey: "second" });
	expect(read("first")).not.toBe(first);
	expect(read("first")).toHaveLength(0);
	expect(read("second").map(h => h.portalHostName)).toEqual(["a"]);
});

it("keeps a snapshot stable for identical registration and unknown removal", () => {
	const receiver = host("a", "first");
	mount(receiver);
	const first = read("first");
	mount({ ...receiver });
	unmount("missing");
	expect(read("first")).toBe(first);
});
