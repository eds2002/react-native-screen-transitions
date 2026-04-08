import { router } from "expo-router";
import { screenTints } from "@/theme";
import {
	NestedExampleScreen,
	useNestedExamplePaths,
} from "./shared";

export default function NestedOuterAScreen() {
	const paths = useNestedExamplePaths();

	return (
		<NestedExampleScreen
			title="Outer A"
			subtitle="Outer stack"
			stackLabel="Outer stack"
			routeLabel="nested/a"
			description="This is the outer stack entry. Push to B for the horizontal transition, or open the nested-b stack to see the vertical handoff."
			tint={screenTints.steel}
			notes={[
				"Outer A -> B should move horizontally.",
				"Outer A -> nested-b/A should move vertically.",
				"From nested-b/A, a vertical dismiss should land back on this outer stack.",
			]}
			actions={[
				{
					label: "Push Outer B",
					onPress: () => router.push(paths.outerB),
					testID: "nested-outer-a-push-b",
				},
				{
					label: "Open Nested B Stack",
					onPress: () =>
						router.push({
							pathname: paths.innerA as never,
							params: { returnTo: paths.outerA },
						}),
					variant: "secondary",
					testID: "nested-outer-a-open-inner",
				},
				{
					label: "Dismiss Outer Stack",
					onPress: () => router.dismissTo(paths.stackHome),
					variant: "secondary",
					testID: "nested-outer-a-dismiss-stack",
				},
			]}
		/>
	);
}
