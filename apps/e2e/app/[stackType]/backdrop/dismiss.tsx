import { BackdropBehaviorSheet } from "@/components/backdrop/behavior-sheet";

export default function DismissBehaviorScreen() {
	return (
		<BackdropBehaviorSheet
			icon="trash"
			tone="#FF6B6B"
			title="Dismiss Backdrop"
			description="Tapping behind this sheet should dismiss it immediately."
			primaryLabel="Close Sheet"
			hint="Backdrop behavior: dismiss"
		/>
	);
}
