import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { useEffect } from "react";
import { ConfigStore } from "@/store/config-store";
import type {
	AwareNativeStackNavigationOptions,
	AwareNavigationProp,
} from "../../types";

interface UseScreenLifecycleProps {
	route: RouteProp<ParamListBase>;
	navigation: AwareNavigationProp<ParamListBase>;
	options: AwareNativeStackNavigationOptions;
}

export const useScreenLifecycle = ({
	route,
	navigation,
	options,
}: UseScreenLifecycleProps) => {
	const parentNavigatorKey = navigation.getParent()?.getState?.()?.key;
	const navigatorKey = navigation.getState().key;
	useEffect(() => {
		const presetConfig = options;

		ConfigStore.updateConfig(route.key, {
			id: route.key,
			name: route.name,
			status: 1,
			closing: false,
			navigatorKey,
			parentNavigatorKey,
			...presetConfig,
		});
	}, [route, options, parentNavigatorKey, navigatorKey]);

	// Handle the screen before remove
	useEffect(() => {
		const unsubscribe = navigation.addListener("beforeRemove", (e) => {
			const shouldSkipPreventDefault = ConfigStore.shouldSkipPreventDefault(
				e.target,
				navigation.getState(),
			);

			if (shouldSkipPreventDefault) {
				ConfigStore.removeConfig(e.target);
				return;
			}

			e.preventDefault();
			const handleFinish = (finished?: boolean) => {
				if (!finished) return;
				if (navigation.canGoBack()) {
					navigation.dispatch(e.data?.action);
					ConfigStore.removeConfig(e.target);
				}
			};

			ConfigStore.updateConfig(e.target, {
				status: 0,
				closing: true,
				onAnimationFinish: handleFinish,
			});
		});

		return () => unsubscribe();
	}, [navigation]);
};
