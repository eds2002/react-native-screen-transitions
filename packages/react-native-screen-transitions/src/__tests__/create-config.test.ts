import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
	createMockNavigation,
	createMockScreen,
	type MockNavigation,
} from "../__mocks__/navigation.mock";
import { reactNativeMock } from "../__mocks__/react-native.mock";
import { reanimatedMock } from "../__mocks__/reanimated.mock";
import { mockRemoveScreen, mockUpdateScreen } from "../__mocks__/store.mock";
import type { AnimationConfig, Any } from "../types";
import { createConfig } from "../utils/create-config";

const mockShouldSkipPreventDefault = mock(() => false);
const mockHandleScreenDismiss = mock(() => {});

mock.module("react-native", () => ({
	...reactNativeMock,
}));

mock.module("react-native-reanimated", () => ({
	...reanimatedMock,
}));

mock.module("@react-navigation/native", () => ({
	...createMockNavigation(),
}));

mock.module("../store/index", () => ({
	ScreenStore: {
		updateScreen: mockUpdateScreen,
		removeScreen: mockRemoveScreen,
		shouldSkipPreventDefault: mockShouldSkipPreventDefault,
		handleScreenDismiss: mockHandleScreenDismiss,
	},
}));

describe("Create config - single screens", () => {
	let navigation: MockNavigation;

	beforeEach(() => {
		mockUpdateScreen.mockClear();
		mockRemoveScreen.mockClear();
		mockShouldSkipPreventDefault.mockClear();
		mockShouldSkipPreventDefault.mockReturnValue(false);
		mockHandleScreenDismiss.mockClear();
		if (navigation) {
			navigation._clearMocks();
		}
	});

	describe("on 'focus' event", () => {
		it("should call ScreenStore.updateScreen with the correct screen data", () => {
			navigation = createMockNavigation();
			const screen = createMockScreen("Home", "screen-1");
			const config = {
				transitionSpec: {
					open: { type: "timing" } as AnimationConfig,
				},
			};

			const listeners = createConfig({ navigation, route: screen, ...config });
			listeners.focus?.({ target: "screen-1" } as Any);

			expect(mockUpdateScreen).toHaveBeenCalledTimes(1);
			expect(mockUpdateScreen).toHaveBeenCalledWith(
				"screen-1",
				expect.objectContaining({
					id: "screen-1",
					name: "Home",
					status: 1,
					closing: false,
					navigatorKey: "nav-1",
					parentNavigatorKey: undefined,
					transitionSpec: config.transitionSpec,
				}),
			);
		});

		it("should set parentNavigatorKey when navigation has parent", () => {
			const parentNavigation = createMockNavigation([], "parent-nav");
			navigation = createMockNavigation();
			navigation.getParent = () => parentNavigation as Any;

			const screen = createMockScreen("ChildScreen", "child-1");
			const listeners = createConfig({ navigation, route: screen });
			listeners.focus?.({ target: "child-1" } as Any);

			expect(mockUpdateScreen).toHaveBeenCalledWith(
				"child-1",
				expect.objectContaining({
					navigatorKey: "nav-1",
					parentNavigatorKey: "parent-nav",
				}),
			);
		});
	});

	describe("on 'beforeRemove' event", () => {
		it("should remove screen immediately when shouldSkipPreventDefault returns true", () => {
			navigation = createMockNavigation([{ key: "screen-1" }]);
			const screen = createMockScreen("Home", "screen-1");
			mockShouldSkipPreventDefault.mockReturnValue(true);

			const listeners = createConfig({ navigation, route: screen });
			const mockEvent = {
				target: "screen-1",
				preventDefault: mock(() => {}),
				data: { action: { type: "GO_BACK" } },
			} as Any;

			listeners.beforeRemove?.(mockEvent);

			expect(mockShouldSkipPreventDefault).toHaveBeenCalledWith(
				"screen-1",
				navigation.getState(),
			);
			expect(mockRemoveScreen).toHaveBeenCalledWith("screen-1");
			expect(mockEvent.preventDefault).not.toHaveBeenCalled();
			expect(mockUpdateScreen).not.toHaveBeenCalled();
		});

		it("should prevent default and update screen for closing animation when shouldSkipPreventDefault returns false", () => {
			navigation = createMockNavigation([
				{ key: "screen-1" },
				{ key: "screen-2" },
			]);
			const screen = createMockScreen("Home", "screen-1");
			mockShouldSkipPreventDefault.mockReturnValue(false);

			const listeners = createConfig({ navigation, route: screen });
			const mockEvent = {
				target: "screen-1",
				preventDefault: mock(() => {}),
				data: { action: { type: "GO_BACK" } },
			} as Any;

			listeners.beforeRemove?.(mockEvent);

			expect(mockEvent.preventDefault).toHaveBeenCalled();
			expect(mockUpdateScreen).toHaveBeenCalledWith("screen-1", {
				status: 0,
				closing: true,
				onAnimationFinish: expect.any(Function),
			});
			expect(mockRemoveScreen).not.toHaveBeenCalled();
		});

		it("should dispatch action and remove screen when animation finishes", () => {
			navigation = createMockNavigation([
				{ key: "screen-1" },
				{ key: "screen-2" },
			]);
			const screen = createMockScreen("Home", "screen-1");
			mockShouldSkipPreventDefault.mockReturnValue(false);

			const listeners = createConfig({ navigation, route: screen });
			const mockAction = { type: "GO_BACK" };
			const mockEvent = {
				target: "screen-1",
				preventDefault: mock(() => {}),
				data: { action: mockAction },
			} as Any;

			listeners.beforeRemove?.(mockEvent);

			// Get the onAnimationFinish callback
			const updateCall = mockUpdateScreen.mock.calls[0];
			const onAnimationFinish = (updateCall[1 as Any] as Any)
				.onAnimationFinish as Any;

			// Simulate animation completion
			onAnimationFinish(true);

			expect(navigation.dispatch).toHaveBeenCalledWith(mockAction);
			expect(mockRemoveScreen).toHaveBeenCalledWith("screen-1");
		});
	});
});
