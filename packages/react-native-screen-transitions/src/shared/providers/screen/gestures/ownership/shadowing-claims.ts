import type { ClaimedDirections } from "../../../../types/ownership.types";

export const resolveShadowingClaimDirections = ({
	isCurrentScreenClosing,
	currentClaimedDirections,
	previousClaimedDirections,
}: {
	isCurrentScreenClosing: boolean;
	currentClaimedDirections: ClaimedDirections;
	previousClaimedDirections: ClaimedDirections;
}): ClaimedDirections => {
	if (isCurrentScreenClosing) {
		return previousClaimedDirections;
	}

	return currentClaimedDirections;
};
