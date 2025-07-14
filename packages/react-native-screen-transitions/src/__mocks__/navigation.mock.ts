import { mock } from "bun:test";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import type { Any } from "../types";

export const createMockNavigation = (
	routes: { key: string }[] = [],
	navigatorKey = "nav-1",
) => {
	const dispatch = mock((action: Any) => action);

	return {
		getState: () => ({ key: navigatorKey, routes }),
		canGoBack: () => true,
		dispatch,
		_clearMocks: () => {
			dispatch.mockClear();
		},
	};
};

export const createMockRoute = (
	name = "TestRoute",
	key = "route-1",
): RouteProp<ParamListBase, string> => ({
	key,
	name,
	params: undefined,
});

export const mockPreventDefault = mock(() => {});

export type MockNavigation = ReturnType<typeof createMockNavigation>;
