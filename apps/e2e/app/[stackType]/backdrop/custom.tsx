import { BackdropBehaviorSheet } from "@/components/backdrop/behavior-sheet";

export default function CustomBackdropScreen() {
	return (
		<BackdropBehaviorSheet
			icon="color-filter"
			tone="#74B9FF"
			title="Custom Backdrop"
			description="This 0.5 snap sheet renders a BlurView backdrop with animated intensity."
			primaryLabel="Close Sheet"
			hint="Backdrop behavior: dismiss, custom backdrop component: BlurView"
		/>
	);
}
