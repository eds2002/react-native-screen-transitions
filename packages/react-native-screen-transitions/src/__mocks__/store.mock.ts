import { mock } from "bun:test";
import type { Any } from "@/types";

export const mockUpdateRoute = mock(() => {});
export const mockRemoveRoute = mock(() => {});
export let routeSubscriber:
	| ((currRoutes: Any, prevRoutes: Any) => void)
	| null = null;

export const mockRouteStoreImplementation = {
	updateRoute: mockUpdateRoute,
	removeRoute: mockRemoveRoute,
	use: {
		subscribeWithSelector: mock((_: Any, subscriber: Any) => {
			routeSubscriber = subscriber;
			return () => {};
		}),
	},
};
