import { BackdropBehaviorSheet } from "@/components/backdrop/behavior-sheet";

export default function CollapseBehaviorScreen() {
	return (
		<BackdropBehaviorSheet
			icon="contract"
			tone="#00CEC9"
			title="Collapse Backdrop"
			description="Tapping behind this sheet should collapse from 0.75 to 0.5 before dismissing."
			primaryLabel="Close Sheet"
			hint="Backdrop behavior: collapse, snap points: [0.5, 0.75]"
			maxSnap={0.75}
		/>
	);
}
