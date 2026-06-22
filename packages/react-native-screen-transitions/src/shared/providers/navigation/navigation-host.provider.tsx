import { createContext, type ReactNode, useContext } from "react";
import type {
	BaseStackNavigation,
	BaseStackRoute,
} from "../../types/stack.types";

export type NavigationScreenProviderComponent = (props: {
	navigation: BaseStackNavigation;
	route: BaseStackRoute;
	children: ReactNode;
}) => ReactNode;

export interface NavigationHostContextValue {
	ScreenProvider: NavigationScreenProviderComponent;
}

const PassthroughScreenProvider: NavigationScreenProviderComponent = ({
	children,
}) => <>{children}</>;

const DEFAULT_NAVIGATION_HOST: NavigationHostContextValue = {
	ScreenProvider: PassthroughScreenProvider,
};

const NavigationHostContext = createContext<NavigationHostContextValue>(
	DEFAULT_NAVIGATION_HOST,
);
NavigationHostContext.displayName = "NavigationHost";

export function NavigationHostProvider({
	children,
	value,
}: {
	children: ReactNode;
	value?: NavigationHostContextValue;
}) {
	return (
		<NavigationHostContext.Provider value={value ?? DEFAULT_NAVIGATION_HOST}>
			{children}
		</NavigationHostContext.Provider>
	);
}

export function NavigationScreenProvider({
	children,
	navigation,
	route,
}: {
	children: ReactNode;
	navigation: BaseStackNavigation;
	route: BaseStackRoute;
}) {
	const { ScreenProvider } = useContext(NavigationHostContext);

	return (
		<ScreenProvider navigation={navigation} route={route}>
			{children}
		</ScreenProvider>
	);
}
