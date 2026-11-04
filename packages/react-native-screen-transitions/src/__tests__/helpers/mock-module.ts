import { afterAll, mock } from "bun:test";
import { fileURLToPath } from "node:url";

/** Replace exports for one test file and restore them before the next file. */
export function createModuleMock(resolve: (specifier: string) => string) {
	const originals = new Map<string, Record<string, unknown>>();
	afterAll(() => {
		// Unwind re-exporting modules before the modules they re-export. Otherwise
		// a barrel's snapshot can reinstall an earlier override during cleanup.
		for (const [specifier, original] of [...originals].reverse()) {
			mock.module(specifier, () => original);
		}
	});
	return async (specifier: string, factory: () => Record<string, unknown>) => {
		const url = resolve(specifier);
		const resolved = url.startsWith("file:") ? fileURLToPath(url) : url;
		if (!originals.has(resolved)) {
			// Copy exports: the module namespace itself has live, mocked bindings.
			originals.set(resolved, { ...(await import(resolved)) });
		}
		mock.module(resolved, () => ({ ...originals.get(resolved), ...factory() }));
	};
}
