import type {
	BaseStackNavigation,
	BaseStackRoute,
	BaseStackState,
} from "../../types/stack.types";
import { getStackRoutes } from "../../utils/navigation/get-stack-routes";
import type { BlankStackStandardNavigatorProps } from "../blank-stack/create-blank-stack-navigator";

export function createBlankStackProps({
	state,
	navigation,
}: {
	state: BaseStackState<BaseStackRoute>;
	navigation: BaseStackNavigation;
}): BlankStackStandardNavigatorProps {
	const { routes } = getStackRoutes(state);

	return {
		navigationState: routes === state.routes ? state : { ...state, routes },
		navigation,
	};
}
