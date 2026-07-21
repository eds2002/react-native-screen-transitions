import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import type {
	NavigationHostContextValue,
	NavigationScreenProviderComponent,
} from "./navigation-host.provider";

const ReactNavigationScreenProvider: NavigationScreenProviderComponent = ({
	children,
	navigation,
	route,
}) => (
	<NavigationContext.Provider value={navigation as never}>
		<NavigationRouteContext.Provider value={route as never}>
			{children}
		</NavigationRouteContext.Provider>
	</NavigationContext.Provider>
);

export const reactNavigationHost: NavigationHostContextValue = {
	ScreenProvider: ReactNavigationScreenProvider,
};
