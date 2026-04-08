import { StackActions } from "@react-navigation/native";
import { useCallback } from "react";
import { useDescriptors } from "../../providers/screen/descriptors";

export function useNavigationHelpers() {
	const { current } = useDescriptors();

	const dismissScreen = useCallback(() => {
		const state = current.navigation.getState();

		current.navigation.dispatch({
			...StackActions.pop(),
			source: current.route.key,
			target: state.key,
		});
	}, [current]);

	return { dismissScreen };
}
