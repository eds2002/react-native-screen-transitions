import { router, useLocalSearchParams } from "expo-router";
import { screenTints } from "@/theme";
import {
	NestedExampleScreen,
	useNestedExamplePaths,
} from "../shared";

export default function NestedInnerBScreen() {
	const paths = useNestedExamplePaths();
	const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
	const outerReturnTarget =
		typeof params.returnTo === "string" && params.returnTo.startsWith("/")
			? (params.returnTo as `/${string}`)
			: paths.outerA;

	return (
		<NestedExampleScreen
			title="Inner B"
			subtitle="Nested-b stack"
			stackLabel="Nested-b stack"
			routeLabel="nested/nested-b/b"
			description="This is the deepest screen in the example. Back from here should be horizontal to inner A, and then a vertical dismiss from inner A should close the nested stack."
			tint={screenTints.lavender}
			notes={[
				"Swiping back from here should return to inner A horizontally.",
				"Once back on inner A, a vertical dismiss should close the entire nested-b stack.",
			]}
			actions={[
				{
					label: "Back To Inner A",
					onPress: () => router.back(),
					variant: "secondary",
					testID: "nested-inner-b-back",
				},
				{
					label: "Dismiss Nested Stack",
					onPress: () => router.dismissTo(outerReturnTarget),
					variant: "secondary",
					testID: "nested-inner-b-dismiss-nested-stack",
				},
				{
					label: "Dismiss Outer Stack",
					onPress: () => router.dismissTo(paths.stackHome),
					variant: "secondary",
					testID: "nested-inner-b-dismiss-outer-stack",
				},
			]}
		/>
	);
}
