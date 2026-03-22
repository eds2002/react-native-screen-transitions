import { describe, expect, it, mock } from "bun:test";
import { createStore } from "../stores/create-store";

describe("createStore", () => {
	it("peekBag returns undefined before initialization", () => {
		const store = createStore({
			createBag: () => ({ count: 1 }),
			disposeBag: () => {},
		});

		expect(store.peekBag("route-a")).toBeUndefined();
	});

	it("getBag returns a stable bag for the same key", () => {
		const store = createStore({
			createBag: () => ({ count: 1 }),
			disposeBag: () => {},
		});

		const first = store.getBag("route-a");
		const second = store.getBag("route-a");

		expect(second).toBe(first);
	});

	it("getValue returns the value from a typed bag key", () => {
		const store = createStore({
			createBag: () => ({
				count: 1,
				label: "demo",
			}),
			disposeBag: () => {},
		});

		const count: number = store.getValue("route-a", "count");
		const label: string = store.getValue("route-a", "label");

		expect(count).toBe(1);
		expect(label).toBe("demo");
	});

	it("clearBag is safe when called repeatedly", () => {
		const disposeBag = mock(() => {});
		const store = createStore({
			createBag: () => ({ count: 1 }),
			disposeBag,
		});

		store.getBag("route-a");

		store.clearBag("route-a");
		store.clearBag("route-a");

		expect(disposeBag).toHaveBeenCalledTimes(1);
		expect(store.peekBag("route-a")).toBeUndefined();
	});

	it("getBaseBag returns a fresh bag without storing it", () => {
		const store = createStore({
			createBag: () => ({ count: 1 }),
			disposeBag: () => {},
		});

		const first = store.getBaseBag();
		const second = store.getBaseBag();

		expect(second).not.toBe(first);
		expect(store.peekBag("route-a")).toBeUndefined();
	});

	it("creates a fresh bag after clearBag", () => {
		const store = createStore({
			createBag: () => ({ count: 1 }),
			disposeBag: () => {},
		});

		const first = store.getBag("route-a");
		store.clearBag("route-a");
		const second = store.getBag("route-a");

		expect(second).not.toBe(first);
	});
});
