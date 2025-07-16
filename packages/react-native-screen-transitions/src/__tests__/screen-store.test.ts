import { beforeEach, describe, expect, it, mock } from "bun:test";
import { reactNavMock } from "../__mocks__/navigation.mock";
import { reactNativeMock } from "../__mocks__/react-native.mock";
import type { Any } from "../types";

mock.module("react-native", () => ({
	...reactNativeMock,
}));

mock.module("@react-navigation/native", () => ({
	...reactNavMock,
}));

let mockStoreState = {
	screens: {},
	screenKeys: [],
};

mock.module("../store", () => ({
	ScreenStore: {
		use: {
			getState: () => mockStoreState,
			setState: (newState: Any) => {
				mockStoreState = { ...mockStoreState, ...newState };
			},
		},
		updateScreen: (key: string, value: Any) => {
			mockStoreState.screens[key] = {
				...mockStoreState.screens[key],
				...value,
			};
		},
	},
}));

const { handleScreenDismiss } = await import(
	"../store/utils/handle-screen-dismiss"
);
const { shouldSkipPreventDefault } = await import(
	"../store/utils/should-skip-prevent-default"
);
const { StackActions } = await import("@react-navigation/native");

describe("ScreenStore functions", () => {
	beforeEach(() => {
		mockStoreState = {
			screens: {},
			screenKeys: [],
		};
	});

	describe("handleScreenDismiss", () => {
		it("calls goBack when the screen does not exist", () => {
			const nav = {
				goBack: mock(() => {}),
				dispatch: mock(() => {}),
			};

			handleScreenDismiss("nonexistent", nav as Any);

			expect(nav.goBack).toHaveBeenCalledTimes(1);
			expect(nav.dispatch).not.toHaveBeenCalled();
		});

		it("calls goBack when dismissed screen exists but has no child screens", () => {
			const nav = {
				goBack: mock(() => {}),
				dispatch: mock(() => {}),
			};

			mockStoreState.screens["screen-1"] = {
				id: "screen-1",
				name: "Screen 1",
				status: 1,
				closing: false,
				navigatorKey: "nav-1",
			};

			handleScreenDismiss("screen-1", nav as Any);

			expect(nav.goBack).toHaveBeenCalledTimes(1);
			expect(nav.dispatch).not.toHaveBeenCalled();
			expect(mockStoreState.screens["screen-1"].closing).toBe(false);
		});

		it("dispatches pop when children exist", () => {
			const nav = {
				goBack: mock(() => {}),
				dispatch: mock(() => {}),
			};

			// Setup parent screen
			mockStoreState.screens["screen-1"] = {
				id: "screen-1",
				name: "Screen 1",
				status: 1,
				closing: false,
				navigatorKey: "nav-parent",
			};

			// Setup child screen
			mockStoreState.screens["screen-2"] = {
				id: "screen-2",
				name: "Screen 2",
				status: 1,
				closing: false,
				navigatorKey: "nav-child",
				parentNavigatorKey: "nav-parent",
			};
			mockStoreState.screens["screen-3"] = {
				id: "screen-3",
				name: "Screen 3",
				status: 1,
				closing: false,
				navigatorKey: "nav-child-2",
				parentNavigatorKey: "nav-parent",
			};

			handleScreenDismiss("screen-1", nav as Any);

			expect(nav.goBack).not.toHaveBeenCalled();
			expect(nav.dispatch).toHaveBeenCalledTimes(1);
			expect(nav.dispatch).toHaveBeenCalledWith(StackActions.pop(2));
			expect(mockStoreState.screens["screen-1"].closing).toBe(true);
		});
	});

	describe("shouldSkipPreventDefault", () => {
		it("returns true when the screen is the only one in the stack", () => {
			mockStoreState.screens["screen-1"] = {
				id: "screen-1",
				name: "Screen 1",
				status: 1,
				closing: false,
				navigatorKey: "nav-1",
			};

			const navigatorState = {
				routes: [{ key: "screen-1" }],
			};

			const result = shouldSkipPreventDefault("screen-1", navigatorState);
			expect(result).toBe(true);
		});

		/**
		 * Children should follow the parent, instantly close the children.
		 */
		it("returns true when parent navigator is exiting", () => {
			mockStoreState.screens["parent-screen"] = {
				id: "parent-screen",
				name: "Parent Screen",
				status: 1,
				closing: true,
				navigatorKey: "parent-nav",
			};

			mockStoreState.screens["child-screen"] = {
				id: "child-screen",
				name: "Child Screen",
				status: 1,
				closing: false,
				navigatorKey: "nav-child",
				parentNavigatorKey: "parent-nav",
			};

			const navigatorState = {
				routes: [{ key: "child-screen" }, { key: "parent-screen" }],
			};

			const result = shouldSkipPreventDefault("child-screen", navigatorState);
			expect(result).toBe(true);
		});

		it("returns false when neither condition is met", () => {
			mockStoreState.screens["screen-1"] = {
				id: "screen-1",
				name: "Screen 1",
				status: 1,
				closing: false,
				navigatorKey: "nav-1",
			};

			const navigatorState = {
				routes: [{ key: "another-screen" }, { key: "screen-1" }],
			};

			const result = shouldSkipPreventDefault("screen-1", navigatorState);

			expect(result).toBe(false);
		});
	});
});
