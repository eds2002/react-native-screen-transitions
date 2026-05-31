import { describe, expect, it } from "bun:test";
import { DefaultSnapSpec } from "../configs/specs";
import type { TransitionSpec } from "../types/animation.types";
import { resolveSnapTransitionSpec } from "../utils/animation/resolve-snap-transition-spec";

describe("resolveSnapTransitionSpec", () => {
	it("uses expand config for upward snap changes", () => {
		const expand = { damping: 12 };
		const collapse = { damping: 40 };
		const spec = { expand, collapse } as TransitionSpec;

		expect(resolveSnapTransitionSpec(spec, "expand")).toEqual({
			open: expand,
			close: expand,
		});
	});

	it("uses collapse config for downward snap changes", () => {
		const expand = { damping: 12 };
		const collapse = { damping: 40 };
		const spec = { expand, collapse } as TransitionSpec;

		expect(resolveSnapTransitionSpec(spec, "collapse")).toEqual({
			open: collapse,
			close: collapse,
		});
	});

	it("falls back to the default snap spec", () => {
		expect(resolveSnapTransitionSpec(undefined, "expand")).toEqual({
			open: DefaultSnapSpec,
			close: DefaultSnapSpec,
		});
	});
});
