import { router, useLocalSearchParams } from "expo-router";
import { screenTints } from "@/theme";
import {
	NestedExampleScreen,
	useNestedExamplePaths,
} from "../shared";

export default function NestedInnerAScreen() {
	const paths = useNestedExamplePaths();
	const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
	const outerReturnTarget =
		typeof params.returnTo === "string" && params.returnTo.startsWith("/")
			? (params.returnTo as `/${string}`)
			: paths.outerA;

	return (
		<NestedExampleScreen
			title="Inner A"
			subtitle="Nested-b stack"
			stackLabel="Nested-b stack"
			routeLabel="nested/nested-b/a"
			description="You are now inside the child stack. Moving to inner B should stay horizontal, while dismissing this stack should return vertically to the outer stack."
			tint={screenTints.mauve}
			notes={[
				"Inner A -> B should move horizontally inside nested-b.",
				"A vertical dismiss from here should close nested-b and reveal the outer stack.",
			]}
			actions={[
				{
					label: "Push Inner B",
					onPress: () =>
						router.push({
							pathname: paths.innerB as never,
							params: { returnTo: outerReturnTarget },
						}),
					testID: "nested-inner-a-push-b",
				},
				{
					label: "Dismiss Nested Stack",
					onPress: () => router.dismissTo(outerReturnTarget),
					variant: "secondary",
					testID: "nested-inner-a-dismiss-nested-stack",
				},
				{
					label: "Dismiss Outer Stack",
					onPress: () => router.dismissTo(paths.stackHome),
					variant: "secondary",
					testID: "nested-inner-a-dismiss-outer-stack",
				},
			]}
		/>
	);
}
