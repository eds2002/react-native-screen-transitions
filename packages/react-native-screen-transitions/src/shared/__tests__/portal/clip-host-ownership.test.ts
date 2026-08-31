import { describe, expect, it } from "bun:test";
import { resolveBoundaryPortalRenderOwnership } from "../../components/boundary/portal/utils/render-ownership";

describe("Boundary.ClipView portal ownership", () => {
	it("keeps the whole host at the root when a nested target owns measurement", () => {
		expect(
			resolveBoundaryPortalRenderOwnership({
				escapeClipping: true,
				handoffEnabled: true,
				hasActiveTarget: true,
				wholeHostPortal: true,
			}),
		).toEqual({
			shouldRenderBoundaryRootThroughPortal: true,
			shouldRenderHandoffHost: true,
		});
	});

	it("preserves the legacy nested-target portal behavior for regular boundaries", () => {
		expect(
			resolveBoundaryPortalRenderOwnership({
				escapeClipping: true,
				handoffEnabled: true,
				hasActiveTarget: true,
				wholeHostPortal: false,
			}),
		).toEqual({
			shouldRenderBoundaryRootThroughPortal: false,
			shouldRenderHandoffHost: false,
		});
	});

	it("keeps inline roots inline while still handing off the whole clip host", () => {
		expect(
			resolveBoundaryPortalRenderOwnership({
				escapeClipping: false,
				handoffEnabled: true,
				hasActiveTarget: true,
				wholeHostPortal: true,
			}),
		).toEqual({
			shouldRenderBoundaryRootThroughPortal: false,
			shouldRenderHandoffHost: true,
		});
	});
});
