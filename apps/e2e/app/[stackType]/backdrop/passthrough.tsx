import { BackdropBehaviorSheet } from "@/components/backdrop/behavior-sheet";

export default function PassthroughBehaviorScreen() {
	return (
		<BackdropBehaviorSheet
			icon="radio"
			tone="#E84393"
			title="Passthrough Backdrop"
			description="Tapping behind this sheet should pass through to the underlying screen."
			primaryLabel="Close Sheet"
			hint="Backdrop behavior: passthrough"
		/>
	);
}
