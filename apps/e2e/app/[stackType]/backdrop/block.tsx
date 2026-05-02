import { BackdropBehaviorSheet } from "@/components/backdrop/behavior-sheet";

export default function BlockBehaviorScreen() {
	return (
		<BackdropBehaviorSheet
			icon="lock-closed"
			tone="#6C5CE7"
			title="Blocked Backdrop"
			description="Tapping behind this sheet should be captured without dismissing."
			primaryLabel="Close Sheet"
			hint="Backdrop behavior: block"
		/>
	);
}
