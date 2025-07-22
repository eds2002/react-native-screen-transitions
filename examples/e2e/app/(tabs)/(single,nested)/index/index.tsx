import { Group } from "@/components/group";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";

const SETTINGS_CONFIG = [
	{
		title: "Single Routes - Programmatic",
		description:
			"Test handling of single routes with programmatic navigation (router.back).",
		routes: [
			{
				title: "/1",
				description: "Test routing to 1 single route.",
				href: "/1",
			},
			{
				title: "/2",
				description: "Test for multiple single routes.",
				href: "/2",
			},
		],
	},
	{
		title: "Single Routes - Gesture Enabled",
		description:
			"Test gesture-based dismissal on single routes (swipe to go back).",
		routes: [
			{
				title: "/gesture-horizontal",
				description: "Horizontal swipe to dismiss (left/right).",
				href: "/gesture-horizontal",
			},
			{
				title: "/gesture-vertical",
				description: "Vertical swipe to dismiss (up/down).",
				href: "/gesture-vertical",
			},
			{
				title: "/gesture-bidirectional",
				description: "Swipe in any direction to dismiss.",
				href: "/gesture-bidirectional",
			},
		],
	},
	{
		title: "Single Routes - Transition Presets",
		description: "Test different built-in transition animations and presets.",
		routes: [
			{
				title: "/preset-slide-top",
				description: "Slide from top transition preset.",
				href: "/preset-slide-top",
			},
			{
				title: "/preset-zoom-in",
				description: "Zoom in/out transition preset.",
				href: "/preset-zoom-in",
			},
			{
				title: "/preset-elastic-card",
				description: "Elastic card with gesture interaction.",
				href: "/preset-elastic-card",
			},
		],
	},
	{
		title: "Single Routes - Edge Cases",
		description: "Test edge cases and error scenarios for single routes.",
		routes: [
			{
				title: "/rapid-navigation",
				description: "Test rapid push/pop navigation.",
				href: "/rapid-navigation",
			},
			{
				title: "/animation-interruption",
				description: "Test interrupting animations mid-transition.",
				href: "/animation-interruption",
			},
		],
	},
];

export default function Single() {
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
