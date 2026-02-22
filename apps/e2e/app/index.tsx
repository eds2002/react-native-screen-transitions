import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
		title: "Component Stack",
		description: "Standalone navigator with bounds-based floating animation",
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
	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<Text style={styles.title}>Screen Transitions E2E</Text>
				<Text style={styles.subtitle}>Select a test category</Text>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Stacks</Text>
					<View style={styles.buttonContainer}>
						{STACK_OPTIONS.map((option) => (
							<Pressable
								key={option.id}
								testID={`${option.id}-button`}
								style={styles.button}
								onPress={() => router.push(`/${option.id}` as `/${string}`)}
							>
								<Text style={styles.buttonTitle}>{option.title}</Text>
								<Text style={styles.buttonDescription}>
									{option.description}
								</Text>
							</Pressable>
						))}
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Gestures</Text>
					<View style={styles.buttonContainer}>
						{GESTURE_OPTIONS.map((option) => (
							<Pressable
								key={option.id}
								testID={`${option.id}-button`}
								style={styles.button}
								onPress={() => router.push(`/${option.id}` as `/${string}`)}
							>
								<Text style={styles.buttonTitle}>{option.title}</Text>
								<Text style={styles.buttonDescription}>
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
		backgroundColor: "#121212",
	},
	scrollContent: {
		padding: 20,
		paddingBottom: 40,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#fff",
		marginTop: 40,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: "#888",
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
		color: "#666",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 12,
		marginLeft: 4,
	},
	buttonContainer: {
		gap: 16,
	},
	button: {
		backgroundColor: "#1e1e1e",
		padding: 24,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "#333",
	},
	buttonTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 8,
	},
	buttonDescription: {
		fontSize: 14,
		color: "#888",
	},
});
