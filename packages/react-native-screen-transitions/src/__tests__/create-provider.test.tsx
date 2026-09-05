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

let injectedFactoryArgument: unknown;
const testProviderFactory = createProvider("Test", { global: true })<
	TestProviderProps,
	{ value: number }
>(({ children, id, value }, ...injectedArguments: unknown[]) => {
	injectedFactoryArgument = injectedArguments[0];

	return {
		children,
		key: id,
		value: { value },
	};
});
const {
	StoreProvider: TestStoreProvider,
	TestProvider,
	useOptionalTestStore,
	useTestStore,
} = testProviderFactory;

const parentObservations: Record<string, number | null> = {};
const { PathProvider, useOptionalPathStore } = createProvider("Path", {
	global: true,
})<TestProviderProps, { value: number }>(
	({ children, id, value }) => {
		parentObservations[id] = useOptionalPathStore(
			(store) => store?.value ?? null,
		);
		return { children, key: id, value: { value } };
	},
);

describe("createProvider global stores", () => {
	it("returns the provider plus strict and optional store hooks", () => {
		expect(Object.keys(testProviderFactory).sort()).toEqual([
			"StoreProvider",
			"TestProvider",
			"getTestStore",
			"useOptionalTestStore",
			"useTestStore",
		]);
	});

	it("does not inject a hidden read primitive into the provider factory", () => {
		let renderer: ReactTestRenderer;

		act(() => {
			renderer = create(<TestProvider id="local" value={7} />);
		});

		expect(injectedFactoryArgument).toBeUndefined();
		act(() => renderer.unmount());
	});

	it("preserves local context selectors", () => {
		let observed: number | null = null;
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

	it("accepts an adapted value through the shared store provider", () => {
		let observed: number | null = null;
		let renderer: ReactTestRenderer;

		function Reader() {
			observed = useTestStore((store) => store.value);
			return null;
		}

		act(() => {
			renderer = create(
				<TestStoreProvider storeKey="adapted" value={{ value: 9 }}>
					<Reader />
				</TestStoreProvider>,
			);
		});

		expect(observed).toBe(9);
		act(() => renderer.unmount());
	});

	it("throws when the strict store hook has no surrounding provider", () => {
		function Reader() {
			useTestStore((store) => store.value);
			return null;
		}

		expect(() => {
			act(() => {
				create(<Reader />);
			});
		}).toThrow("TestStore is unavailable");
	});

	it("reads a nullable surrounding provider through the optional hook", () => {
		const observed: Array<number | null> = [];
		let renderer: ReactTestRenderer;

		function Reader() {
			observed.push(useOptionalTestStore((store) => store?.value ?? null));
			return null;
		}

		act(() => {
			renderer = create(
			<>
				<Reader />
				<TestProvider id="parent" value={7}>
					<Reader />
				</TestProvider>
			</>,
			);
		});

		expect(observed).toEqual([null, 7]);
		act(() => renderer.unmount());
	});

	it("reads a provider store by key outside its context after registration", () => {
		let observed: number | null = null;
		let renderer: ReactTestRenderer;

		function Reader() {
			observed = useOptionalTestStore("screen-a", (store) => store.value);
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

	it("releases a keyed store when its provider unmounts", () => {
		let observed: number | null = null;
		let renderer: ReactTestRenderer;

		function Reader() {
			observed = useOptionalTestStore("screen-a", (store) => store.value);
			return null;
		}

		act(() => {
			renderer = create(
				<>
					<TestProvider
						id="screen-a"
						value={1}
					/>
					<Reader />
				</>,
			);
		});

		act(() => renderer.update(<Reader />));

		expect(observed).toBeNull();
		act(() => renderer.unmount());
	});

	it("returns null from an optional keyed read with no matching provider", () => {
		let observed: number | null = 1;
		let renderer: ReactTestRenderer;

		function Reader() {
			observed = useOptionalTestStore("screen-b", (store) => store.value);
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

	it("throws when a strict keyed read has no matching provider", () => {
		function Reader() {
			useTestStore("screen-b", (store) => store.value);
			return null;
		}

		expect(() => {
			act(() => {
				create(
					<TestProvider id="screen-a" value={1}>
						<Reader />
					</TestProvider>,
				);
			});
		}).toThrow("TestStore is unavailable for key \"screen-b\"");
	});

	it("isolates keyed stores and subscribes to provider updates", () => {
		const observed: Record<string, number | null> = {};
		let renderer: ReactTestRenderer;

		function Reader({ id }: { id: string }) {
			observed[id] = useOptionalTestStore(id, (store) => store.value);
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

	it("reads the surrounding provider during nested provider construction", () => {
		let renderer: ReactTestRenderer;

		act(() => {
			renderer = create(
				<PathProvider id="parent" value={7}>
					<PathProvider id="child" value={8} />
				</PathProvider>,
			);
		});

		expect(parentObservations).toMatchObject({ parent: null, child: 7 });
		act(() => renderer.unmount());
	});
});
