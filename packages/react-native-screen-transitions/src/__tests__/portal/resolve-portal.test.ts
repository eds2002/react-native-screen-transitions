import { describe, expect, it } from "bun:test";
import { resolveBoundaryPortal } from "../../components/boundary/portal/utils/resolve-portal";

describe("resolveBoundaryPortal", () => {
	it("reuses canonical runtimes for equivalent options", () => {
		for (const options of [
			{},
			{ handoff: true },
			{ escapeClipping: true },
			{ handoff: true, escapeClipping: true },
		]) {
			expect(resolveBoundaryPortal(options)).toBe(
				resolveBoundaryPortal(options),
			);
		}
	});
});
