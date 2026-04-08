import { router } from "expo-router";
import { screenTints } from "@/theme";
import { NestedExampleScreen, useNestedExamplePaths } from "./shared";

export default function NestedOuterBScreen() {
	const paths = useNestedExamplePaths();

	return (
		<NestedExampleScreen
			title="Outer B"
			subtitle="Outer stack"
			stackLabel="Outer stack"
			routeLabel="nested/b"
			description="This screen lives in the same outer stack as A. Swiping back here should stay purely horizontal, then nested-b should still open vertically."
			tint={screenTints.navy}
			notes={[
				"Swiping back from here should return to outer A horizontally.",
				"Opening nested-b from here should still use the vertical transition.",
			]}
			actions={[
				{
					label: "Open Nested B Stack",
					onPress: () =>
						router.push({
							pathname: paths.innerA as never,
							params: { returnTo: paths.outerB },
						}),
					testID: "nested-outer-b-open-inner",
				},
				{
					label: "Back To Outer A",
					onPress: () => router.back(),
					variant: "secondary",
					testID: "nested-outer-b-back",
				},
				{
					label: "Dismiss Outer Stack",
					onPress: () => router.dismissTo(paths.stackHome),
					variant: "secondary",
					testID: "nested-outer-b-dismiss-stack",
				},
			]}
		/>
	);
}
