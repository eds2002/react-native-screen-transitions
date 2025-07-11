import { router } from "expo-router";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Transition from "react-native-screen-transitions";

const singleRoutes = [
	{
		label: "Slide from top",
		href: "/a" as const,
		preset: Transition.presets.SlideFromTop(),
	},
	{
		label: "Zoom in",
		href: "/b" as const,
		preset: Transition.presets.ZoomIn(),
	},
	{
		label: "Slide from bottom",
		href: "/c" as const,
		preset: Transition.presets.SlideFromBottom(),
	},
	{
		label: "Draggable Card",
		href: "/d" as const,
		preset: Transition.presets.DraggableCard(),
	},
	{
		label: "Elastic Card",
		href: "/e" as const,
		preset: Transition.presets.ElasticCard(),
	},
];

const groupRoutes = [
	{
		label: "Draggable card animation",
		href: "/group-a/a" as const,
	},
];

const customRoutes = [
	{
		label: "Custom screen level animation",
		href: "/custom" as const,
	},
];

const Group = ({
	children,
	onPress,
}: {
	children: React.ReactNode;
	onPress: () => void;
}) => {
	return (
		<TouchableOpacity
			style={styles.group}
			onPress={onPress}
			activeOpacity={0.8}
		>
			{children}
		</TouchableOpacity>
	);
};

const TransitionScrollView = Transition.createTransitionComponent(ScrollView);

export default function TabOneScreen() {
	return (
		<TransitionScrollView
			style={styles.container}
			contentContainerStyle={{
				paddingVertical: 100,
				gap: 32,

			}}
		>
			<View style={{ width: "100%", gap: 12, paddingHorizontal: 36 }}>
				<View style={{ gap: 2 }}>
					<Text style={{ fontSize: 18, fontWeight: "600" }}>
						Individual Routes
					</Text>
					<Text style={{ fontSize: 13, color: "gray" }}>
						Examples of route transitions using predefined presets for routes
						not in groups.
					</Text>
				</View>
				{singleRoutes.map((link) => (
					<Group key={link.href} onPress={() => router.push(link.href)}>
						<Text style={styles.link}>{link.href}</Text>
						<Text style={styles.dimmed}>{link.label} animation</Text>
					</Group>
				))}
			</View>
			<View style={{ width: "100%", gap: 12, paddingHorizontal: 36 }}>
				<View style={{ gap: 2 }}>
					<Text style={{ fontSize: 18, fontWeight: "600" }}>
						Grouped Routes with Layouts
					</Text>
					<Text style={{ fontSize: 13, color: "gray" }}>
						Examples of defining transitions for groups of routes using layouts
						with nested stacks.
					</Text>
				</View>
				{groupRoutes.map((link) => (
					<Group key={link.href} onPress={() => router.push(link.href)}>
						<Text style={styles.link}>{link.href}</Text>
						<Text style={styles.dimmed}>{link.label}</Text>
					</Group>
				))}
			</View>
			<View style={{ width: "100%", gap: 12, paddingHorizontal: 36 }}>
				<View style={{ gap: 2 }}>
					<Text style={{ fontSize: 18, fontWeight: "600" }}>
						Screen-Level Transitions
					</Text>
					<Text style={{ fontSize: 13, color: "gray" }}>
						Examples of defining custom animations directly within individual
						route components.
					</Text>
				</View>
				{customRoutes.map((link) => (
					<Group key={link.href} onPress={() => router.push(link.href)}>
						<Text style={styles.link}>{link.href}</Text>
						<Text style={styles.dimmed}>{link.label}</Text>
					</Group>
				))}
			</View>
		</TransitionScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: 12,
	},
	group: {
		gap: 4,
		padding: 16,
		backgroundColor: "#FFF",
		width: "100%",
		borderRadius: 24,
	},
	link: {
		fontSize: 16,
		fontWeight: "500",
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: "80%",
	},
	dimmed: {
		fontSize: 13,
		color: "gray",
	},
});
