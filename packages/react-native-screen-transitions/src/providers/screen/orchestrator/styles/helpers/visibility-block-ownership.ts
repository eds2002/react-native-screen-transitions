type VisibilityBlockOwnershipParams = {
	localBlocked: boolean;
	ancestorBlocked: boolean;
};

export const resolveVisibilityBlockOwnership = ({
	localBlocked,
	ancestorBlocked,
}: VisibilityBlockOwnershipParams) => {
	"worklet";

	return {
		appliesOffset: localBlocked && !ancestorBlocked,
		effectiveBlocked: localBlocked || ancestorBlocked,
	};
};
