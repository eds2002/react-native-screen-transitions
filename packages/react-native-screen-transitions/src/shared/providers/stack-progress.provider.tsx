import type { NavigationRoute, ParamListBase } from "@react-navigation/native";
import type { ReactNode } from "react";
import createProvider from "./utils/create-provider";

interface StackProgressContextValue {
	routes: NavigationRoute<ParamListBase, string>[];
}

interface StackProgressProviderProps extends StackProgressContextValue {
	children: ReactNode;
}

const { useStackProgressContext, StackProgressProvider } = createProvider(
	"StackProgress",
)<StackProgressProviderProps, StackProgressContextValue>(({ routes }) => {
	return {
		value: {
			routes,
		},
	};
});

export { useStackProgressContext, StackProgressProvider };
