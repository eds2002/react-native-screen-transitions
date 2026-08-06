import { describe, expect, it } from "bun:test";
import {
	dispatchCloseAction,
	isCloseActionReplay,
} from "../utils/navigation/close-action-replay";
import {
	doesNavigatorOwnCloseAction,
	shouldInterceptClose,
} from "../components/screen-lifecycle/hooks/helpers/close-interception-rules";

describe("close transition intent", () => {
	it("only lets the focused route own a multi-route close animation", () => {
		expect(
			shouldInterceptClose({
				enabled: true,
				ownsAction: true,
				ancestorDismissing: false,
				routeIndex: 2,
				focusedIndex: 2,
			}),
		).toBe(true);

		expect(
			shouldInterceptClose({
				enabled: true,
				ownsAction: true,
				ancestorDismissing: false,
				routeIndex: 1,
				focusedIndex: 2,
			}),
		).toBe(false);
	});

	it("allows removal when transitions cannot own the close", () => {
		expect(
			shouldInterceptClose({
				enabled: false,
				ownsAction: true,
				ancestorDismissing: false,
				routeIndex: 1,
				focusedIndex: 1,
			}),
		).toBe(false);
		expect(
			shouldInterceptClose({
				enabled: true,
				ownsAction: true,
				ancestorDismissing: true,
				routeIndex: 1,
				focusedIndex: 1,
			}),
		).toBe(false);
		expect(
			shouldInterceptClose({
				enabled: true,
				ownsAction: true,
				ancestorDismissing: false,
				routeIndex: 0,
				focusedIndex: 0,
			}),
		).toBe(false);
	});

	it("does not let a nested navigator claim its parent's action", () => {
		expect(
			shouldInterceptClose({
				enabled: true,
				ownsAction: false,
				ancestorDismissing: false,
				routeIndex: 1,
				focusedIndex: 1,
			}),
		).toBe(false);
	});

	it("assigns a bubbled child action to its parent route tree", () => {
		const childState = {
			key: "child-stack",
			routes: [{ key: "child-a" }, { key: "child-b" }],
		};
		const parentState = {
			key: "parent-stack",
			routes: [{ key: "parent-a" }, { key: "parent-b", state: childState }],
		};

		expect(
			doesNavigatorOwnCloseAction({
				state: childState,
				action: { source: "parent-b" },
			}),
		).toBe(false);
		expect(
			doesNavigatorOwnCloseAction({
				state: parentState,
				action: { source: "child-a" },
			}),
		).toBe(true);
	});

	it("claims an untargeted action delivered to the route", () => {
		const state = { key: "stack", routes: [{ key: "a" }, { key: "b" }] };

		expect(doesNavigatorOwnCloseAction({ state, action: {} })).toBe(true);
	});

	it("treats an explicit navigator target as authoritative", () => {
		const state = { key: "stack", routes: [{ key: "a" }, { key: "b" }] };

		expect(
			doesNavigatorOwnCloseAction({
				state,
				action: { source: "outside", target: "stack" },
			}),
		).toBe(true);
		expect(
			doesNavigatorOwnCloseAction({
				state,
				action: { source: "b", target: "other-stack" },
			}),
		).toBe(false);
	});

	it("carries terminal replay through nested navigator action clones", () => {
		const action = { type: "POP", payload: { count: 1 } };

		dispatchCloseAction(action, (replayedAction) => {
			expect(replayedAction).toBe(action);
			expect(isCloseActionReplay(replayedAction)).toBe(true);
			expect(isCloseActionReplay({ ...replayedAction })).toBe(true);
		});

		expect(isCloseActionReplay(action)).toBe(false);
	});
});
