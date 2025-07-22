import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";

import { Group } from "@/components/group";

const SETTINGS_CONFIG = [
	{
		title: "Nested Routes - Programmatic",
		description:
			"Test handling of nested routes with programmatic navigation (router.back).",
		routes: [
			{
				title: "/nested/a/one",
				description: "Test deeply nested routing programmatically.",
				href: "/nested/a/one",
			},
		],
	},
	{
		title: "Nested Routes - Gesture Dismissal",
		description:
			"Test gesture-based dismissal from deeply nested routes back to parent navigators.",
		routes: [
			{
				title: "/nested/a/one",
				description: "Test dismissal from nested/a/two back to ROOT.",
				href: "/nested/a/one",
			},
		],
	},
];

export default function Nested() {
	return (
		<Transition.ScrollView
			style={styles.screen}
			contentContainerStyle={{ gap: 24, paddingBottom: 100 }}
			testID="ROOT"
		>
			{SETTINGS_CONFIG.map((group) => (
				<Group key={group.title} {...group} />
			))}
		</Transition.ScrollView>
	);
}
