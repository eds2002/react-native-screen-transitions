import { describe, expect, it } from "bun:test";
import { LifecycleTransitionRequestKind } from "../../stores/system.store";
import { resolveScreenVisibilityGate } from "../../providers/screen/styles/helpers/visibility-gate";

describe("resolveScreenVisibilityGate", () => {
	const baseState = {
		hasVisibilityGateOpened: false,
		pendingLifecycleStartBlockCount: 0,
		pendingLifecycleRequestKind: LifecycleTransitionRequestKind.None,
		progress: 1,
		entering: 0,
	};

	it("blocks pending opens before the first transformed frame", () => {
		expect(
			resolveScreenVisibilityGate({
				...baseState,
				pendingLifecycleStartBlockCount: 1,
				pendingLifecycleRequestKind: LifecycleTransitionRequestKind.Open,
				progress: 0,
			}),
		).toEqual({
			shouldBlock: true,
			shouldOpenGate: false,
		});
	});

	it("keeps entering screens blocked while progress is still zero", () => {
		expect(
			resolveScreenVisibilityGate({
				...baseState,
				progress: 0,
				entering: 1,
			}),
		).toEqual({
			shouldBlock: true,
			shouldOpenGate: false,
		});
	});

	it("opens after entering progress has started", () => {
		expect(
			resolveScreenVisibilityGate({
				...baseState,
				progress: 0.01,
				entering: 1,
			}),
		).toEqual({
			shouldBlock: false,
			shouldOpenGate: true,
		});
	});

	it("does not block floating overlays", () => {
		expect(
			resolveScreenVisibilityGate({
				...baseState,
				isFloatingOverlay: true,
				pendingLifecycleStartBlockCount: 1,
				pendingLifecycleRequestKind: LifecycleTransitionRequestKind.Open,
				progress: 0,
			}),
		).toEqual({
			shouldBlock: false,
			shouldOpenGate: false,
		});
	});
});
