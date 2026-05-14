import { describe, expect, it } from "bun:test";
import {
	resolveScreenVisibilityGate,
	shouldBlockScreenVisibility,
} from "../../providers/screen/styles/helpers/visibility-gate";
import { LifecycleTransitionRequestKind } from "../../stores/system.store";

describe("shouldBlockScreenVisibility", () => {
	it("keeps a pending opening screen hidden before progress starts", () => {
		expect(
			shouldBlockScreenVisibility({
				hasVisibilityGateOpened: false,
				pendingLifecycleStartBlockCount: 0,
				pendingLifecycleRequestKind: LifecycleTransitionRequestKind.Open,
				progress: 0,
				entering: 0,
			}),
		).toBe(true);
	});

	it("keeps an opening screen hidden after the open request clears but before progress starts", () => {
		expect(
			shouldBlockScreenVisibility({
				hasVisibilityGateOpened: false,
				pendingLifecycleStartBlockCount: 0,
				pendingLifecycleRequestKind: LifecycleTransitionRequestKind.None,
				progress: 0,
				entering: 1,
			}),
		).toBe(true);
	});

	it("opens visibility after the first opening progress frame", () => {
		expect(
			resolveScreenVisibilityGate({
				hasVisibilityGateOpened: false,
				pendingLifecycleStartBlockCount: 0,
				pendingLifecycleRequestKind: LifecycleTransitionRequestKind.None,
				progress: 0.01,
				entering: 1,
			}),
		).toEqual({
			shouldBlock: false,
			shouldOpenGate: true,
		});
	});

	it("does not permanently open the gate while still at zero progress", () => {
		expect(
			resolveScreenVisibilityGate({
				hasVisibilityGateOpened: false,
				pendingLifecycleStartBlockCount: 0,
				pendingLifecycleRequestKind: LifecycleTransitionRequestKind.None,
				progress: 0,
				entering: 0,
			}),
		).toEqual({
			shouldBlock: false,
			shouldOpenGate: false,
		});
	});

	it("does not block closed non-opening screens", () => {
		expect(
			shouldBlockScreenVisibility({
				hasVisibilityGateOpened: false,
				pendingLifecycleStartBlockCount: 0,
				pendingLifecycleRequestKind: LifecycleTransitionRequestKind.None,
				progress: 0,
				entering: 0,
			}),
		).toBe(false);
	});

	it("does not block floating overlays", () => {
		expect(
			shouldBlockScreenVisibility({
				isFloatingOverlay: true,
				hasVisibilityGateOpened: false,
				pendingLifecycleStartBlockCount: 1,
				pendingLifecycleRequestKind: LifecycleTransitionRequestKind.Open,
				progress: 0,
				entering: 0,
			}),
		).toBe(false);
	});

	it("does not re-close after the visibility gate has opened", () => {
		expect(
			shouldBlockScreenVisibility({
				hasVisibilityGateOpened: true,
				pendingLifecycleStartBlockCount: 1,
				pendingLifecycleRequestKind: LifecycleTransitionRequestKind.Open,
				progress: 0,
				entering: 1,
			}),
		).toBe(false);
	});
});
