import { screenTopology } from "../providers/screen/topology/helpers/create-screen-topology";
import type { ScreenTransitionValue } from "../types/animation.types";

export const transition = (key: string): ScreenTransitionValue | null => {
	return screenTopology.getTransition(key);
};
