import type { NavigationRoute, ParamListBase } from "@react-navigation/native";
import { type ReactNode, useMemo } from "react";
import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import { AnimationStore } from "../stores/animation-store";
import createProvider from "./utils/create-provider";

interface StackProgressContextValue {
	stackProgress: DerivedValue<number>;
}

interface StackProgressProviderProps {
	children: ReactNode;
	routes: NavigationRoute<ParamListBase, string>[];
}

const { useStackProgressContext, StackProgressProvider } = createProvider(
	"StackProgress",
)<StackProgressProviderProps, StackProgressContextValue>(({ routes }) => {
	const progressValues = useMemo(() => {
		return routes.map((route) => AnimationStore.getAll(route.key));
	}, [routes]);

	const stackProgress = useDerivedValue(() => {
		"worklet";
		let total = 0;
		for (let i = 0; i < progressValues.length; i++) {
			total += progressValues[i].progress.value;
		}
		return total;
	});
	return {
		value: {
			stackProgress,
		},
	};
});

export { useStackProgressContext, StackProgressProvider };
