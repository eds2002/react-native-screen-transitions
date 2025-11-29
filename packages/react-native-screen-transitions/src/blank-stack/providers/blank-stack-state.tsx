import type { NavigationRoute, ParamListBase } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDerivedValue } from "react-native-reanimated";
import { useSharedValueState } from "../../shared/hooks/use-shared-value-state";
import createProvider from "../../shared/providers/utils/create-provider";
import { AnimationStore } from "../../shared/stores/animation-store";
import { useStackNavigationContext } from "../utils/with-stack-navigation";

interface BlankStackStateProviderProps {
	children: React.ReactNode;
}

type BlankStackStateProviderContext = {
	parentIndex: number;
	parentRoutes: NavigationRoute<ParamListBase, string>[];
	index: number;
	routes: NavigationRoute<ParamListBase, string>[];
};

const {
	useBlankStackStateContext: useBlankStackState,
	BlankStackStateProvider,
} = createProvider("BlankStackState", { guarded: false })<
	BlankStackStateProviderProps,
	BlankStackStateProviderContext
>(() => {
	const { focusedIndex, routes: stackRoutes } = useStackNavigationContext();
	const [index, setIndex] = useState(0);
	const [routes, setRoutes] = useState<
		NavigationRoute<ParamListBase, string>[]
	>([]);

	const progressValues = useMemo(
		() => stackRoutes.map((route) => AnimationStore.getAll(route.key)),
		[stackRoutes],
	);

	const parentIndex = useDerivedValue(() => {
		"worklet";

		const activeIndex = progressValues.length - 1;
		const isOneDismissing = Number(
			progressValues.some((value) => value.closing.value > 0),
		);

		const optimisticIndex = activeIndex - isOneDismissing;

		return optimisticIndex;
	}, [focusedIndex, progressValues]);

	const parentIndexValue = useSharedValueState(parentIndex);

	const _registerNested = useCallback(
		(
			nestedIndex: number,
			nestedRoutes: NavigationRoute<ParamListBase, string>[],
		) => {
			if (nestedIndex !== index) {
				setIndex(nestedIndex);
			}
			if (nestedRoutes.length !== routes.length) {
				setRoutes(nestedRoutes);
			}
		},
		[routes.length, index],
	);

	const context = useBlankStackState();

	useEffect(() => {
		//@ts-expect-error Internally used
		if (context?._registerNested) {
			//@ts-expect-error Internally used
			context._registerNested(parentIndexValue, stackRoutes);
		}
		//@ts-expect-error Internally used
	}, [parentIndexValue, context?._registerNested, stackRoutes]);

	return {
		value: {
			parentIndex: parentIndexValue,
			parentRoutes: stackRoutes,
			index,
			routes,
			_registerNested,
		},
	};
});

export { useBlankStackState, BlankStackStateProvider };
