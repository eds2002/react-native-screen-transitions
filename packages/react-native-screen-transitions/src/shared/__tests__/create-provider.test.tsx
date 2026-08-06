import { describe, expect, it } from "bun:test";
import type { ReactNode } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import createProvider from "../utils/create-provider";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

type TestProviderProps = {
	children?: ReactNode;
	id: string;
	value: number;
};

const { TestProvider, useTestStore } = createProvider("Test", {
	guarded: true,
	global: true,
})<TestProviderProps, { value: number }>(({ children, id, value }) => ({
	children,
	key: id,
	value: { value },
}));

describe("createProvider global stores", () => {
	it("preserves local context selectors", () => {
		let observed = 0;
		let renderer: ReactTestRenderer;

		function Reader() {
			observed = useTestStore((store) => store.value);
			return null;
		}

		act(() => {
			renderer = create(
				<TestProvider id="local" value={7}>
					<Reader />
				</TestProvider>,
			);
		});

		expect(observed).toBe(7);
		act(() => renderer.unmount());
	});

	it("reads a provider store by key outside its context", () => {
		let observed: number | null = null;
		let renderer: ReactTestRenderer;

		function Reader() {
			observed = useTestStore("screen-a", (store) => store.value);
			return null;
		}

		act(() => {
			renderer = create(
				<>
					<TestProvider id="screen-a" value={1} />
					<Reader />
				</>,
			);
		});

		expect(observed).toBe(1);
		act(() => renderer.unmount());
	});

	it("resolves a keyed read from its matching local provider immediately", () => {
		const observed: Array<number | null> = [];
		let renderer: ReactTestRenderer;

		function Reader() {
			observed.push(useTestStore("screen-a", (store) => store.value));
			return null;
		}

		act(() => {
			renderer = create(
				<TestProvider id="screen-a" value={1}>
					<Reader />
				</TestProvider>,
			);
		});

		expect(observed).toEqual([1]);
		act(() => renderer.unmount());
	});

	it("does not resolve a keyed read from an unrelated local provider", () => {
		let observed: number | null = 1;
		let renderer: ReactTestRenderer;

		function Reader() {
			observed = useTestStore("screen-b", (store) => store.value);
			return null;
		}

		act(() => {
			renderer = create(
				<TestProvider id="screen-a" value={1}>
					<Reader />
				</TestProvider>,
			);
		});

		expect(observed).toBeNull();
		act(() => renderer.unmount());
	});

	it("isolates keyed stores and forwards updates from their providers", () => {
		const observed: Record<string, number | null> = {};
		let renderer: ReactTestRenderer;

		function Reader({ id }: { id: string }) {
			observed[id] = useTestStore(id, (store) => store.value);
			return null;
		}

		const renderTree = (a: number, b: number) => (
			<>
				<TestProvider id="screen-a" value={a} />
				<TestProvider id="screen-b" value={b} />
				<Reader id="screen-a" />
				<Reader id="screen-b" />
			</>
		);

		act(() => {
			renderer = create(renderTree(1, 2));
		});

		expect(observed).toEqual({ "screen-a": 1, "screen-b": 2 });

		act(() => {
			renderer.update(renderTree(3, 4));
		});

		expect(observed).toEqual({ "screen-a": 3, "screen-b": 4 });
		act(() => renderer.unmount());
	});

	it("does not let stale cleanup remove a newer store with the same key", () => {
		let observed: number | null = null;
		let renderer: ReactTestRenderer;

		function Reader() {
			observed = useTestStore("shared", (store) => store.value);
			return null;
		}

		const renderTree = (showFirst: boolean, showSecond: boolean) => (
			<>
				{showFirst ? (
					<TestProvider key="first" id="shared" value={1} />
				) : null}
				{showSecond ? (
					<TestProvider key="second" id="shared" value={2} />
				) : null}
				<Reader />
			</>
		);

		act(() => {
			renderer = create(renderTree(true, true));
		});
		expect(observed).toBe(2);

		act(() => {
			renderer.update(renderTree(false, true));
		});
		expect(observed).toBe(2);

		act(() => {
			renderer.update(renderTree(false, false));
		});
		expect(observed).toBeNull();

		act(() => renderer.unmount());
	});
});
