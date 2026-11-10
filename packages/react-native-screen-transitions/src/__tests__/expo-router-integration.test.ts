import { describe, expect, it, mock } from "bun:test";

const StackRouter = () => ({});

const createIntegration = (version: string) =>
	mock((_navigator: unknown, _router: unknown, _options: unknown) => ({
		version,
		Screen: () => null,
	}));

// Each import gets its own query so the entry module re-evaluates against the mock
// registered just before it. Re-mocking a loaded module keeps exports the new mock leaves
// out, so both names are always set; `undefined` stands in for a missing export.
let importCount = 0;
const importEntry = async (exports: Record<string, unknown>) => {
	mock.module("expo-router", () => ({
		StackRouter,
		integrateWithRouter: undefined,
		unstable_integrateWithRouter: undefined,
		...exports,
	}));
	importCount += 1;
	return import(`../navigators/expo-router/index.tsx?case=${importCount}`);
};

describe("Expo Router entry", () => {
	it("uses the stable integrateWithRouter when Expo Router exports it (58+)", async () => {
		const integrateWithRouter = createIntegration("stable");
		const unstable_integrateWithRouter = createIntegration("unstable");

		const { BlankStack } = await importEntry({
			integrateWithRouter,
			unstable_integrateWithRouter,
		});

		expect(integrateWithRouter).toHaveBeenCalledTimes(1);
		expect(unstable_integrateWithRouter).not.toHaveBeenCalled();
		expect(integrateWithRouter.mock.calls[0]?.[1]).toBe(StackRouter);
		expect((BlankStack as unknown as { version: string }).version).toBe(
			"stable",
		);
	});

	it("falls back to unstable_integrateWithRouter on Expo Router 56 and 57", async () => {
		const unstable_integrateWithRouter = createIntegration("unstable");

		const { BlankStack } = await importEntry({ unstable_integrateWithRouter });

		expect(unstable_integrateWithRouter).toHaveBeenCalledTimes(1);
		expect((BlankStack as unknown as { version: string }).version).toBe(
			"unstable",
		);
	});
});
