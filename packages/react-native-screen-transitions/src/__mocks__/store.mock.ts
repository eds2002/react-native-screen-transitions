import { mock } from "bun:test";
import type { Any } from "../types";

export const mockUpdateScreen = mock(() => {});
export const mockRemoveScreen = mock(() => {});
export const mockGetState = mock(() => ({
	screens: {},
	screenKeys: [],
}));
export const mockHandleScreenDismiss = mock(() => {});

export const mockShouldSkipPreventDefault = mock(() => false);
export let screenSubscriber:
	| ((currScreens: Any, prevScreens: Any) => void)
	| null = null;

export const mockScreenStoreImplementation = {
	updateScreen: mockUpdateScreen,
	removeScreen: mockRemoveScreen,
	use: {
		subscribeWithSelector: mock((_: Any, subscriber: Any) => {
			screenSubscriber = subscriber;
			return () => {};
		}),
		getState: mockGetState,
		setState: mock(() => {}),
	},
	shouldSkipPreventDefault: mockShouldSkipPreventDefault,
	handleScreenDismiss: mock(() => {}),
	getState: () => mockGetState(),
};
