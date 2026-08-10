import { NestedBoundarySource } from "../nested-boundary-example";

export default function ParentSourceScreen() {
	return (
		<NestedBoundarySource
			title="Parent source"
			destination="bounds/example-2/nested/nested/nested/destination"
		/>
	);
}
