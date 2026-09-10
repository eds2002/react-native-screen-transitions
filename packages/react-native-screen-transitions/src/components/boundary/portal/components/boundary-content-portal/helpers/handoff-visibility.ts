export function canActivateHandoffReceiver({
	returningFromActiveClose,
	activatingPairDestination,
	animationProgress,
	receiverIsActiveDestination,
	destinationVisibilityBlocked,
}: {
	returningFromActiveClose: boolean;
	activatingPairDestination: boolean;
	animationProgress: number;
	receiverIsActiveDestination: boolean;
	destinationVisibilityBlocked: boolean | undefined;
}) {
	"worklet";
	// Keep the loaded source in place until its receiving screen is visible.
	if (receiverIsActiveDestination && destinationVisibilityBlocked !== false)
		return false;
	return (
		returningFromActiveClose ||
		activatingPairDestination ||
		animationProgress > 0
	);
}
