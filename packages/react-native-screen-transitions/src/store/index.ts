import type { RouteState, RouteStateStore } from "../types";
import { createVanillaStore } from "./utils/create-vanilla-store";

const useRouteStore = createVanillaStore<RouteStateStore>({
	routes: {},
	routeKeys: [],
});

export const RouteStore = {
	use: useRouteStore,
	updateRoute: (key: string | undefined, value: Partial<RouteState>) => {
		if (!key) return;

		useRouteStore.setState(({ routeKeys, routes }) => {
			const currentRoute = routes[key];

			if (currentRoute) {
				routes[key] = {
					...currentRoute,
					...value,
				};
			} else {
				const { name = "", status = 0, closing = false, ...rest } = value;

				const newIndex = routeKeys.length;

				routes[key] = {
					id: key,
					index: newIndex,
					name,
					status,
					closing,
					...rest,
				};

				routeKeys.push(key);
			}
		});
	},
	removeRoute: (key: string | undefined) => {
		if (!key) return;
		useRouteStore.setState(({ routes, routeKeys }) => {
			delete routes[key];

			const indexToRemove = routeKeys.indexOf(key);

			if (indexToRemove > -1) {
				routeKeys.splice(indexToRemove, 1);
			}
		});
	},
	getPreviousRoute: (key: string | undefined): RouteState | null => {
		if (!key) return null;
		const index = useRouteStore.getState().routeKeys.indexOf(key);

		return index > -1
			? useRouteStore.getState().routes[
					useRouteStore.getState().routeKeys[index - 1]
				]
			: null;
	},
};
