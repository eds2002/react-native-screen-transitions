export function canActivateHandoffReceiver({
	returningFromActiveClose,
	activatingPairDestination,
	animationProgress,
	receiverIsActiveDestination,
	destinationIsScreenReady,
}: {
	returningFromActiveClose: boolean;
	activatingPairDestination: boolean;
	animationProgress: number;
	receiverIsActiveDestination: boolean;
	destinationIsScreenReady: boolean | undefined;
}) {
	"worklet";
	// Keep the loaded source in place until its receiving screen is visible.
	if (receiverIsActiveDestination && destinationIsScreenReady !== true)
		return false;
	return (
		returningFromActiveClose ||
		activatingPairDestination ||
		animationProgress > 0
	);
}
