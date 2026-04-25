import { StackActions } from "@react-navigation/native";
import { useCallback } from "react";
import { useDescriptors } from "../../providers/screen/descriptors";

export function useNavigationHelpers() {
	const {
		current: { navigation, route },
	} = useDescriptors();

	const dismissScreen = useCallback(() => {
		const state = navigation.getState();

		navigation.dispatch({
			...StackActions.pop(),
			source: route.key,
			target: state.key,
		});
	}, [navigation, route.key]);

	return { dismissScreen };
}
