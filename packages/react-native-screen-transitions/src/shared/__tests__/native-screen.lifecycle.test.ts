import { describe, expect, it } from "bun:test";
import {
	resolveNativeScreenLifecycle,
	resolveNativeScreenPointerEvents,
	shouldUnmountNativeScreen,
} from "../components/native-screen-lifecycle";

const createLifecycleInput = (
	overrides: Partial<Parameters<typeof resolveNativeScreenLifecycle>[0]> = {},
): Parameters<typeof resolveNativeScreenLifecycle>[0] => ({
	index: 2,
	routesLength: 3,
	isPreloaded: false,
	focusedIndex: 2,
	isClosing: 0,
	inactiveBehavior: "pause",
	...overrides,
});

describe("resolveNativeScreenLifecycle", () => {
	it("keeps the focused top screen normal and visible", () => {
		const lifecycle = resolveNativeScreenLifecycle(createLifecycleInput());

		expect(lifecycle.visible).toBe(true);
		expect(lifecycle.mode).toBe("normal");
	});

	it("keeps a closing top screen normal while it animates out", () => {
		const lifecycle = resolveNativeScreenLifecycle(
			createLifecycleInput({
				focusedIndex: 1,
				isClosing: 1,
			}),
		);

		expect(lifecycle.visible).toBe(true);
		expect(lifecycle.mode).toBe("normal");
	});

	it("keeps the screen before the top route inert and visible", () => {
		const lifecycle = resolveNativeScreenLifecycle(
			createLifecycleInput({
				index: 1,
			}),
		);

		expect(lifecycle.visible).toBe(true);
		expect(lifecycle.mode).toBe("inert");
	});

	it("keeps preloaded screens inert and visible", () => {
		const lifecycle = resolveNativeScreenLifecycle(
			createLifecycleInput({
				index: 0,
				isPreloaded: true,
			}),
		);

		expect(lifecycle.visible).toBe(true);
		expect(lifecycle.mode).toBe("inert");
	});

	it("keeps the screen below a non-blocking backdrop inert and visible", () => {
		const lifecycle = resolveNativeScreenLifecycle(
			createLifecycleInput({
				index: 0,
				routesLength: 4,
				focusedIndex: 3,
				nextBackdropBehavior: "passthrough",
			}),
		);

		expect(lifecycle.visible).toBe(true);
		expect(lifecycle.mode).toBe("inert");
	});

	it("pauses off-window screens by default", () => {
		const lifecycle = resolveNativeScreenLifecycle(
			createLifecycleInput({
				index: 0,
				focusedIndex: 2,
			}),
		);

		expect(lifecycle.visible).toBe(false);
		expect(lifecycle.mode).toBe("paused");
	});

	it("keeps off-window screens inert when inactiveBehavior is none", () => {
		const lifecycle = resolveNativeScreenLifecycle(
			createLifecycleInput({
				index: 0,
				focusedIndex: 2,
				inactiveBehavior: "none",
			}),
		);

		expect(lifecycle.visible).toBe(false);
		expect(lifecycle.mode).toBe("inert");
	});
});

describe("shouldUnmountNativeScreen", () => {
	it("unmounts invisible screens when configured to do so", () => {
		expect(
			shouldUnmountNativeScreen({
				inactiveBehavior: "unmount",
				visible: false,
				hasNestedState: false,
			}),
		).toBe(true);
	});

	it("keeps nested navigators mounted", () => {
		expect(
			shouldUnmountNativeScreen({
				inactiveBehavior: "unmount",
				visible: false,
				hasNestedState: true,
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
