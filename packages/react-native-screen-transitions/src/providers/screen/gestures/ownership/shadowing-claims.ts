import type { ClaimedDirections } from "../../../../types/ownership.types";
import type { StackSceneActivity } from "../../../../types/stack.types";

export const resolveShadowingClaimDirections = ({
	currentActivity,
	currentClaimedDirections,
	previousClaimedDirections,
}: {
	currentActivity: StackSceneActivity | undefined;
	currentClaimedDirections: ClaimedDirections;
	previousClaimedDirections: ClaimedDirections;
}): ClaimedDirections => {
	if (currentActivity === "closing") {
		return previousClaimedDirections;
	}

	return currentClaimedDirections;
};
