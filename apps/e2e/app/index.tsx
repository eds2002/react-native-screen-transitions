import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
	buildBenchmarkDashboardPath,
	PUBLIC_BENCHMARKS,
} from "@/components/benchmark/scenarios";
import {
	buildStackPath,
	type StackType,
} from "@/components/stack-examples/stack-routing";
import { useStackSelection } from "@/components/stack-examples/stack-selection";
import { TEST_FLOWS } from "@/components/stack-examples/test-flows";
import { useTheme } from "@/theme";

const STACK_OPTIONS = [
	{
		id: "native-stack",
		title: "Native Stack",
		description: "Uses @react-navigation/native-stack with custom transitions",
	},
	{
		id: "blank-stack",
		title: "Blank Stack",
		description: "Pure JS stack with full control over transitions",
	},
] satisfies {
	id: StackType;
	title: string;
	description: string;
}[];

const BENCHMARK_OPTIONS = PUBLIC_BENCHMARKS.map((benchmark) => ({
	id: benchmark.id,
	title: benchmark.title,
	description: benchmark.description,
	route: buildBenchmarkDashboardPath(benchmark.id),
}));

const GESTURE_OPTIONS = [
	{
		id: "gestures",
		title: "Gesture Ownership",
		description:
			"Test gesture ownership, inheritance, shadowing, and ScrollView handoff",
	},
];

const MAESTRO_OPTIONS = [
	{
		id: "maestro",
		title: "Maestro Fixtures",
		description: "Dedicated deterministic e2e fixtures for the Maestro suite",
		route: "/maestro" as const,
	},
];

const STACK_GROUP_OPTIONS = [
	{
		id: "presets",
		title: "Presets",
		description:
			"Built-in transition presets, excluding Instagram and Apple Music",
		route: "/presets" as const,
	},
	{
		id: "backdrop",
		title: "Backdrop",
		description: "Custom backdrop components and backdrop tap behavior",
		route: "/backdrop" as const,
	},
];

export default function HomeScreen() {
	const theme = useTheme();
	const { stackType, setStackType } = useStackSelection();
	const selectedStack = STACK_OPTIONS.find((option) => option.id === stackType);
	const stackTestPrefix = stackType === "native-stack" ? "native" : "blank";

	return (
		<ScrollView contentContainerStyle={styles.scrollContent}>
			<Text style={[styles.title, { color: theme.text }]}>
				Screen Transitions E2E
			</Text>
			<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
				Select a test category
			</Text>

			<View style={styles.section}>
				<Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
					Stacks
				</Text>
				<View style={[styles.stackPicker, { backgroundColor: theme.card }]}>
					<View style={styles.segmentedControl}>
						{STACK_OPTIONS.map((option) => {
							const isSelected = option.id === stackType;
							return (
								<Pressable
									key={option.id}
									testID={`${option.id}-switch`}
									style={({ pressed }) => [
										styles.segment,
										{
											backgroundColor: isSelected
												? theme.actionButton
												: pressed
													? theme.cardPressed
													: "transparent",
										},
									]}
									onPress={() => setStackType(option.id)}
								>
									<Text
										style={[
											styles.segmentText,
											{
												color: isSelected ? theme.actionButtonText : theme.text,
											},
										]}
									>
										{option.title}
									</Text>
								</Pressable>
							);
						})}
					</View>
					<Text style={[styles.buttonTitle, { color: theme.text }]}>
						Stack Examples
					</Text>
					<Text
						style={[styles.buttonDescription, { color: theme.textSecondary }]}
					>
						{selectedStack?.description}
					</Text>
				</View>
				<View style={[styles.buttonContainer, styles.examplesList]}>
					{STACK_GROUP_OPTIONS.map((option) => (
						<Pressable
							key={option.id}
							testID={`${option.id}-button`}
							style={({ pressed }) => [
								styles.button,
								{
									backgroundColor: pressed ? theme.cardPressed : theme.card,
								},
							]}
							onPress={() => router.push(option.route)}
						>
							<Text style={[styles.buttonTitle, { color: theme.text }]}>
								{option.title}
							</Text>
							<Text
								style={[
									styles.buttonDescription,
									{ color: theme.textSecondary },
								]}
							>
								{option.description}
							</Text>
						</Pressable>
					))}
					{TEST_FLOWS.map((option) => (
						<Pressable
							key={option.id}
							testID={`${stackTestPrefix}-${option.id}`}
							style={({ pressed }) => [
								styles.button,
								{
									backgroundColor: pressed ? theme.cardPressed : theme.card,
								},
							]}
							onPress={() =>
								router.push(buildStackPath(stackType, option.id) as never)
							}
						>
							<Text style={[styles.buttonTitle, { color: theme.text }]}>
								{option.title}
							</Text>
							<Text
								style={[
									styles.buttonDescription,
									{ color: theme.textSecondary },
								]}
							>
								{option.description}
							</Text>
						</Pressable>
					))}
				</View>
			</View>

			<View style={styles.section}>
				<Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
					Gestures
				</Text>
				<View style={styles.buttonContainer}>
					{GESTURE_OPTIONS.map((option) => (
						<Pressable
							key={option.id}
							testID={`${option.id}-button`}
							style={({ pressed }) => [
								styles.button,
								{
									backgroundColor: pressed ? theme.cardPressed : theme.card,
								},
							]}
							onPress={() => router.push(`/${option.id}` as `/${string}`)}
						>
							<Text style={[styles.buttonTitle, { color: theme.text }]}>
								{option.title}
							</Text>
							<Text
								style={[
									styles.buttonDescription,
									{ color: theme.textSecondary },
								]}
							>
								{option.description}
							</Text>
						</Pressable>
					))}
				</View>
			</View>

			<View style={styles.section}>
				<Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
					Maestro
				</Text>
				<View style={styles.buttonContainer}>
					{MAESTRO_OPTIONS.map((option) => (
						<Pressable
							key={option.id}
							testID={`${option.id}-button`}
							style={({ pressed }) => [
								styles.button,
								{
									backgroundColor: pressed ? theme.cardPressed : theme.card,
								},
							]}
							onPress={() => router.push(option.route)}
						>
							<Text style={[styles.buttonTitle, { color: theme.text }]}>
								{option.title}
							</Text>
							<Text
								style={[
									styles.buttonDescription,
									{ color: theme.textSecondary },
								]}
							>
								{option.description}
							</Text>
						</Pressable>
					))}
				</View>
			</View>

			<View style={styles.section}>
				<Text style={[styles.sectionTitle, { color: theme.textTertiary }]}>
					Benchmarks
				</Text>
				<View style={styles.buttonContainer}>
					{BENCHMARK_OPTIONS.map((option) => (
						<Pressable
							key={option.id}
							testID={`${option.id}-button`}
							style={({ pressed }) => [
								styles.button,
								{
									backgroundColor: pressed ? theme.cardPressed : theme.card,
								},
							]}
							onPress={() => router.push(option.route)}
						>
							<Text style={[styles.buttonTitle, { color: theme.text }]}>
								{option.title}
							</Text>
							<Text
								style={[
									styles.buttonDescription,
									{ color: theme.textSecondary },
								]}
							>
								{option.description}
							</Text>
						</Pressable>
					))}
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginTop: 40,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		marginTop: 8,
		textAlign: "center",
		marginBottom: 32,
	},
	section: {
		marginBottom: 32,
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 12,
		marginLeft: 4,
	},
	buttonContainer: {
		gap: 12,
	},
	stackPicker: {
		padding: 20,
		borderRadius: 14,
		gap: 14,
	},
	examplesList: {
		marginTop: 12,
	},
	segmentedControl: {
		flexDirection: "row",
		gap: 6,
	},
	segment: {
		flex: 1,
		minHeight: 44,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 10,
	},
	segmentText: {
		fontSize: 14,
		fontWeight: "700",
		textAlign: "center",
	},
	button: {
		padding: 20,
		borderRadius: 14,
	},
	buttonTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 4,
	},
	buttonDescription: {
		fontSize: 14,
	},
});
