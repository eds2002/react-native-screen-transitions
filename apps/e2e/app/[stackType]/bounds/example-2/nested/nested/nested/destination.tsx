import { NestedBoundaryDestination } from "../../../../nested-boundary-example";

export default function DeeplyNestedDestinationScreen() {
	return (
		<NestedBoundaryDestination
			title="Deeply nested destination"
			updateParentRoute={3}
		/>
	);
}
