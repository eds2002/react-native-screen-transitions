import { mock } from "bun:test";
import type { ParamListBase, RouteProp } from "@react-navigation/native";
import type { Any } from "../types";

export const createMockNavigation = (
	routes: { key: string }[] = [],
	navigatorKey = "nav-1",
) => {
	const dispatch = mock((action: Any) => action);
	const goBack = mock(() => {});

	return {
		getState: () => ({ key: navigatorKey, routes }),
		canGoBack: () => true,
		dispatch,
		goBack,
		_clearMocks: () => {
			dispatch.mockClear();
			goBack.mockClear();
		},
		getParent: () => undefined,
		StackActions: {
			pop: mock((count: number) => ({ type: "POP", payload: { count } })),
		},
	};
};

export const createMockScreen = (
	name = "TestScreen",
	key = "screen-1",
): RouteProp<ParamListBase, string> => ({
	key,
	name,
	params: undefined,
});

export const mockPreventDefault = mock(() => {});

export type MockNavigation = ReturnType<typeof createMockNavigation>;

export const reactNavMock = createMockNavigation();
