import type { StackSceneActivity } from "../../../../types/stack.types";

export const shouldUpdateScreenInterpolator = (
	activity: StackSceneActivity,
	updateInactiveInterpolators: boolean,
) => activity !== "inactive" || updateInactiveInterpolators;
