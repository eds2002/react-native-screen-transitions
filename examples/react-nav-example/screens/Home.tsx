import { useNavigation } from "@react-navigation/native";
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
		screen: "ScreenA" as const,
		preset: Transition.presets.SlideFromTop(),
	},
	{
		label: "Zoom in",
		screen: "ScreenB" as const,
		preset: Transition.presets.ZoomIn(),
	},
	{
		label: "Slide from bottom",
		screen: "ScreenC" as const,
		preset: Transition.presets.SlideFromBottom(),
	},
	{
		label: "Draggable Card",
		screen: "ScreenD" as const,
		preset: Transition.presets.DraggableCard(),
	},
	{
		label: "Elastic Card",
		screen: "ScreenE" as const,
		preset: Transition.presets.ElasticCard(),
	},
];

const groupRoutes = [
	{
		label: "Draggable card animation",
		screen: "GroupA" as const,
	},
];

const customRoutes = [
	{
		label: "Custom screen level animation",
		screen: "Custom" as const,
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

export function Home() {
	const navigation = useNavigation();
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
						Transitions for Non-Nested Screens
					</Text>
					<Text style={{ fontSize: 13, color: "gray" }}>
						Examples of screen transitions using predefined presets for screens
						directly in the root navigator.
					</Text>
				</View>
				{singleRoutes.map((link) => (
					<Group
						key={link.screen}
						onPress={() => navigation.navigate(link.screen as never)}
					>
						<Text style={styles.link}>{link.screen}</Text>
						<Text style={styles.dimmed}>{link.label} animation</Text>
					</Group>
				))}
			</View>
			<View style={{ width: "100%", gap: 12, paddingHorizontal: 36 }}>
				<View style={{ gap: 2 }}>
					<Text style={{ fontSize: 18, fontWeight: "600" }}>
						Transitions for Nested Navigators
					</Text>
					<Text style={{ fontSize: 13, color: "gray" }}>
						Examples of defining transitions for groups of screens within nested
						navigators.
					</Text>
				</View>
				{groupRoutes.map((link) => (
					<Group
						key={link.screen}
						onPress={() => navigation.navigate(link.screen as never)}
					>
						<Text style={styles.link}>{link.screen}</Text>
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
						screen components.
					</Text>
				</View>
				{customRoutes.map((link) => (
					<Group
						key={link.screen}
						onPress={() => navigation.navigate(link.screen as never)}
					>
						<Text style={styles.link}>{link.screen}</Text>
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
