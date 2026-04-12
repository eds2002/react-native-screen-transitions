import { describe, expect, it } from "bun:test";
import {
	resolveNativeScreenState,
	resolveNativeScreenPointerEvents,
	shouldUnmountNativeScreen,
} from "../components/screen-host/helpers";

const createLifecycleInput = (
	overrides: Partial<Parameters<typeof resolveNativeScreenState>[0]> = {},
): Parameters<typeof resolveNativeScreenState>[0] => ({
	index: 2,
	routesLength: 3,
	isPreloaded: false,
	focusedIndex: 2,
	isClosing: 0,
	...overrides,
});

describe("resolveNativeScreenState", () => {
	it("keeps the focused top screen interactive", () => {
		const state = resolveNativeScreenState(createLifecycleInput());

		expect(state).toBe("interactive");
	});

	it("keeps a closing top screen interactive while it animates out", () => {
		const state = resolveNativeScreenState(
			createLifecycleInput({
				focusedIndex: 1,
				isClosing: 1,
			}),
		);

		expect(state).toBe("interactive");
	});

	it("keeps the screen before the top route inert", () => {
		const state = resolveNativeScreenState(
			createLifecycleInput({
				index: 1,
			}),
		);

		expect(state).toBe("inert");
	});

	it("keeps preloaded screens inert", () => {
		const state = resolveNativeScreenState(
			createLifecycleInput({
				index: 0,
				isPreloaded: true,
			}),
		);

		expect(state).toBe("inert");
	});

	it("keeps the screen below a non-blocking backdrop inert", () => {
		const state = resolveNativeScreenState(
			createLifecycleInput({
				index: 0,
				routesLength: 4,
				focusedIndex: 3,
				nextBackdropBehavior: "passthrough",
			}),
		);

		expect(state).toBe("inert");
	});

	it("keeps the nearest non-closing screen below a closing block inert", () => {
		const state = resolveNativeScreenState(
			createLifecycleInput({
				index: 0,
				focusedIndex: 2,
				shouldRetainAcrossClosingGap: true,
			}),
		);

		expect(state).toBe("inert");
	});

	it("marks off-window screens inactive", () => {
		const state = resolveNativeScreenState(
			createLifecycleInput({
				index: 0,
				focusedIndex: 2,
			}),
		);

		expect(state).toBe("inactive");
	});
});

describe("shouldUnmountNativeScreen", () => {
	it("unmounts inactive screens when configured to do so", () => {
		expect(
			shouldUnmountNativeScreen({
				inactiveBehavior: "unmount",
				state: "inactive",
				hasNestedState: false,
			}),
		).toBe(true);
	});

	it("keeps nested navigators mounted", () => {
		expect(
			shouldUnmountNativeScreen({
				inactiveBehavior: "unmount",
				state: "inactive",
				hasNestedState: true,
			}),
		).toBe(false);
	});

	it("keeps inert screens mounted even when unmount is configured", () => {
		expect(
			shouldUnmountNativeScreen({
				inactiveBehavior: "unmount",
				state: "inert",
				hasNestedState: false,
			}),
		).toBe(false);
	});
});

describe("resolveNativeScreenPointerEvents", () => {
	it("disables touches for closing screens", () => {
		expect(
			resolveNativeScreenPointerEvents({
				isClosing: true,
				isActive: true,
				isAllowedPassthroughBelow: false,
			}),
		).toBe("none");
	});

	it("allows touches on the active screen and passthrough sibling", () => {
		expect(
			resolveNativeScreenPointerEvents({
				isClosing: false,
				isActive: true,
				isAllowedPassthroughBelow: false,
			}),
		).toBe("box-none");

		expect(
			resolveNativeScreenPointerEvents({
				isClosing: false,
				isActive: false,
				isAllowedPassthroughBelow: true,
			}),
		).toBe("box-none");
	});
});
