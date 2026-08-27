import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

const EXAMPLES = [
	{
		eyebrow: "BOUNDARY ZOOM",
		title: "Profile → avatar",
		description: "Native header first, then a shared-element style zoom.",
		accent: "#5B5FEF",
		route: "/native-stack-adapter-recipe/profile",
		testID: "native-stack-adapter-open-profile",
	},
	{
		eyebrow: "NESTED FLOW",
		title: "Book a trip",
		description:
			"A complete booking flow with three nested stacks, native screens, custom motion, forms, and preserved state.",
		accent: "#F05A47",
		route: "/native-stack-adapter-recipe/booking",
		testID: "native-stack-adapter-open-booking",
	},
] as const;

export default function NativeStackAdapterRecipeIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.heading}>
					<Text style={[styles.kicker, { color: theme.textSecondary }]}>
						ADAPTER SHOWCASE
					</Text>
					<Text style={[styles.title, { color: theme.text }]}>
						Native stack.{"\n"}Custom motion.
					</Text>
					<Text style={[styles.intro, { color: theme.textSecondary }]}>
						Keep native-stack navigation and opt individual screens into
						screen-transitions.
					</Text>
				</View>

				<View style={styles.examples}>
					{EXAMPLES.map((example, index) => (
						<Pressable
							key={example.route}
							testID={example.testID}
							onPress={() => router.push(example.route)}
							style={({ pressed }) => [
								styles.example,
								{ backgroundColor: theme.card, opacity: pressed ? 0.72 : 1 },
							]}
						>
							<View
								style={[styles.number, { backgroundColor: example.accent }]}
							>
								<Text style={styles.numberText}>0{index + 1}</Text>
							</View>
							<View style={styles.exampleCopy}>
								<Text style={[styles.eyebrow, { color: example.accent }]}>
									{example.eyebrow}
								</Text>
								<Text style={[styles.exampleTitle, { color: theme.text }]}>
									{example.title}
								</Text>
								<Text
									style={[styles.description, { color: theme.textSecondary }]}
								>
									{example.description}
								</Text>
							</View>
							<Text style={[styles.arrow, { color: theme.textTertiary }]}>
								→
							</Text>
						</Pressable>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 22,
		paddingTop: 42,
		paddingBottom: 36,
	},
	heading: {
		gap: 12,
		marginBottom: 34,
	},
	kicker: {
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 2,
	},
	title: {
		fontSize: 46,
		fontWeight: "900",
		lineHeight: 48,
		letterSpacing: -1.8,
	},
	intro: {
		fontSize: 16,
		fontWeight: "500",
		lineHeight: 23,
		maxWidth: 340,
	},
	examples: {
		gap: 12,
	},
	example: {
		minHeight: 134,
		borderRadius: 26,
		padding: 18,
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 14,
	},
	number: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	numberText: {
		color: "white",
		fontSize: 14,
		fontWeight: "900",
	},
	exampleCopy: {
		flex: 1,
		gap: 5,
	},
	eyebrow: {
		fontSize: 10,
		fontWeight: "900",
		letterSpacing: 1.2,
	},
	exampleTitle: {
		fontSize: 20,
		fontWeight: "800",
		letterSpacing: -0.4,
	},
	description: {
		fontSize: 14,
		fontWeight: "500",
		lineHeight: 19,
	},
	arrow: {
		fontSize: 24,
		fontWeight: "500",
	},
});
