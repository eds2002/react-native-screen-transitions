import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
	{
		id: "component-stack",
		title: "Component Stack (Deprecated)",
		description: "Standalone navigator with bounds-based floating animation",
	},
];

const BENCHMARK_OPTIONS = [
	{
		id: "stack-benchmark",
		title: "Stack Benchmark (Transparency)",
		description:
			"Run a 20-cycle benchmark to compare blank-stack and js-stack side-by-side",
	},
];

const GESTURE_OPTIONS = [
	{
		id: "gestures",
		title: "Gesture Ownership",
		description:
			"Test gesture ownership, inheritance, shadowing, and ScrollView handoff",
	},
];

export default function HomeScreen() {
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<Text style={[styles.title, { color: theme.text }]}>
					Screen Transitions E2E
				</Text>
				<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
					Select a test category
				</Text>

				<View style={styles.section}>
					<Text
						style={[styles.sectionTitle, { color: theme.textTertiary }]}
					>
						Stacks
					</Text>
					<View style={styles.buttonContainer}>
						{STACK_OPTIONS.map((option) => (
							<Pressable
								key={option.id}
								testID={`${option.id}-button`}
								style={({ pressed }) => [
									styles.button,
									{
										backgroundColor: pressed
											? theme.cardPressed
											: theme.card,
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
					<Text
						style={[styles.sectionTitle, { color: theme.textTertiary }]}
					>
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
										backgroundColor: pressed
											? theme.cardPressed
											: theme.card,
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
					<Text
						style={[styles.sectionTitle, { color: theme.textTertiary }]}
					>
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
										backgroundColor: pressed
											? theme.cardPressed
											: theme.card,
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
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
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
