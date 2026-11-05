import type { ReactNode } from "react";
import type { NavigatorStoreValue } from "../../../types/providers/blank-stack-provider.types";
import createProvider from "../../../utils/create-provider";

/**
 * The navigator's scenes, read by the scene rows, overlays and lifecycle of a navigator built with
 * `useTransitionNavigator`. The engine never reads this store: it reads the screen host.
 */
const { StoreProvider: NavigatorStoreProvider, useNavigatorStore } =
	createProvider("Navigator")<
		{ value: NavigatorStoreValue; children: ReactNode },
		NavigatorStoreValue
	>(({ value, children }) => ({ value, children }), {
		getRouteActivity: (store, key) => store.scenesByKey[key]?.activity,
	});

export type { NavigatorStoreValue };
export { NavigatorStoreProvider, useNavigatorStore };
