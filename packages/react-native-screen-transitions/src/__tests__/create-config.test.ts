import { beforeEach, describe, expect, it, mock } from "bun:test";

import "../__mocks__/reanimated.mock";
import {
	createMockNavigation,
	createMockRoute,
	type MockNavigation,
} from "../__mocks__/navigation.mock";
import { reactNativeMock } from "../__mocks__/react-native.mock";
import {
	mockRemoveRoute,
	mockRouteStoreImplementation,
	mockUpdateRoute,
} from "../__mocks__/store.mock";
import type { AnimationConfig, Any, BeforeRemoveEvent } from "../types";
import { createConfig } from "../utils/create-config";

mock.module("../store/index", () => ({
	RouteStore: mockRouteStoreImplementation,
}));
mock.module("react-native", () => reactNativeMock);

describe("Create config - single routes", () => {
	let navigation: MockNavigation;

	beforeEach(() => {
		mockUpdateRoute.mockClear();
		mockRemoveRoute.mockClear();
		if (navigation) {
			navigation._clearMocks();
		}
	});

	describe("on 'focus' event", () => {
		it("should call RouteStore.updateRoute with the correct route data", () => {
			navigation = createMockNavigation();
			const route = createMockRoute("Home", "route-1");
			const config = {
				transitionSpec: {
					open: { type: "timing" } as AnimationConfig,
				},
			};

			const listeners = createConfig({ navigation, route, ...config });
			listeners.focus?.({ target: "route-1" } as Any);

			expect(mockUpdateRoute).toHaveBeenCalledTimes(1);
			expect(mockUpdateRoute).toHaveBeenCalledWith(
				"route-1",
				expect.objectContaining({
					id: "route-1",
					name: "Home",
					status: 1,
					closing: false,
					navigatorKey: "nav-1",
					transitionSpec: config.transitionSpec,
				}),
			);
		});
	});

	describe("on 'beforeRemove' event", () => {
		it("should start a closing animation when it's NOT the last screen in the stack", () => {
			navigation = createMockNavigation([
				{ key: "route-1" },
				{ key: "route-2" },
			]);
			const route = createMockRoute("Profile", "route-2");
			const listeners = createConfig({ navigation, route });
			const mockPreventDefault = mock(() => {});

			const beforeRemoveEvent = {
				target: "route-2",
				preventDefault: mockPreventDefault,
				data: { action: { type: "GO_BACK" } },
			} as unknown as BeforeRemoveEvent;

			listeners.beforeRemove?.(beforeRemoveEvent);

			expect(mockPreventDefault).toHaveBeenCalledTimes(1);
			expect(mockUpdateRoute).toHaveBeenCalledTimes(1);
			expect(mockUpdateRoute).toHaveBeenCalledWith(
				"route-2",
				expect.objectContaining({
					status: 0,
					closing: true,
				}),
			);
			expect(mockRemoveRoute).not.toHaveBeenCalled();

			const payload = mockUpdateRoute.mock.calls[0][1 as Any] as unknown as {
				onAnimationFinish?: (finished?: boolean) => void;
			};
			payload.onAnimationFinish?.(true);

			expect(navigation.dispatch).toHaveBeenCalledTimes(1);
			expect(mockRemoveRoute).toHaveBeenCalledTimes(1);
			expect(mockRemoveRoute).toHaveBeenCalledWith("route-2");
		});

		it("should remove the route immediately when it IS the last screen in the stack", () => {
			navigation = createMockNavigation([{ key: "route-1" }]);
			const route = createMockRoute("Home", "route-1");
			const listeners = createConfig({ navigation, route });
			const mockPreventDefault = mock(() => {});

			const beforeRemoveEvent = {
				target: "route-1",
				preventDefault: mockPreventDefault,
				data: { action: { type: "GO_BACK" } },
			} as unknown as BeforeRemoveEvent;

			listeners.beforeRemove?.(beforeRemoveEvent);

			expect(mockPreventDefault).not.toHaveBeenCalled();
			expect(mockUpdateRoute).not.toHaveBeenCalled();
			expect(mockRemoveRoute).toHaveBeenCalledTimes(1);
			expect(mockRemoveRoute).toHaveBeenCalledWith("route-1");
		});
	});
});
