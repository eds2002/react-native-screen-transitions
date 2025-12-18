import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import {
	type ComponentStackScreenProps,
	createComponentNavigator,
} from "react-native-screen-transitions/component-stack";

const Stack = createComponentNavigator();

function HomeScreen({ navigation }: ComponentStackScreenProps) {
	return (
		<View style={styles.screen}>
			<Text style={styles.screenTitle}>Home</Text>
			<Text style={styles.screenSubtitle}>Component Stack Demo</Text>

			<View style={styles.buttonGroup}>
				<Pressable
					testID="push-details"
					style={styles.navButton}
					onPress={() => navigation.push("Details", { id: 1 })}
				>
					<Text style={styles.navButtonText}>Push Details</Text>
				</Pressable>

				<Pressable
					testID="push-settings"
					style={styles.navButton}
					onPress={() => navigation.push("Settings")}
				>
					<Text style={styles.navButtonText}>Push Settings</Text>
				</Pressable>
			</View>
		</View>
	);
}

function DetailsScreen({ navigation, route }: ComponentStackScreenProps) {
	const id = (route.params as { id?: number })?.id ?? 0;

	return (
		<View style={[styles.screen, { backgroundColor: "#1a3a5c" }]}>
			<Text style={styles.screenTitle}>Details #{id}</Text>

			<View style={styles.buttonGroup}>
				<Pressable
					testID="push-nested-details"
					style={styles.navButton}
					onPress={() => navigation.push("Details", { id: id + 1 })}
				>
					<Text style={styles.navButtonText}>Push Details #{id + 1}</Text>
				</Pressable>

				<Pressable
					testID="go-back"
					style={[styles.navButton, styles.backButton]}
					onPress={() => navigation.goBack()}
				>
					<Text style={styles.navButtonText}>Go Back</Text>
				</Pressable>
			</View>
		</View>
	);
}

function SettingsScreen({ navigation }: ComponentStackScreenProps) {
	return (
		<View style={[styles.screen, { backgroundColor: "#3a1a5c" }]}>
			<Text style={styles.screenTitle}>Settings</Text>

			<View style={styles.buttonGroup}>
				<Pressable
					testID="navigate-home"
					style={styles.navButton}
					onPress={() => navigation.navigate("Home")}
				>
					<Text style={styles.navButtonText}>Navigate to Home</Text>
				</Pressable>

				<Pressable
					testID="reset-stack"
					style={styles.navButton}
					onPress={() => navigation.reset()}
				>
					<Text style={styles.navButtonText}>Reset Stack</Text>
				</Pressable>

				<Pressable
					testID="go-back-settings"
					style={[styles.navButton, styles.backButton]}
					onPress={() => navigation.goBack()}
				>
					<Text style={styles.navButtonText}>Go Back</Text>
				</Pressable>
			</View>
		</View>
	);
}

function ComponentStackDemo() {
	return (
		<Stack.Navigator initialRouteName="Home" screenOptions={{}}>
			<Stack.Screen name="Home" component={HomeScreen} />
			<Stack.Screen
				name="Details"
				component={DetailsScreen}
				options={{
					gestureDirection: "horizontal",
					gestureEnabled: true,
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { width },
						},
					}) => {
						"worklet";
						const translateX = interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width * 0.3],
						);
						return {
							contentStyle: {
								transform: [{ translateX }],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<Stack.Screen name="Settings" component={SettingsScreen} />
		</Stack.Navigator>
	);
}

export default function ComponentStackPage() {
	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Pressable
					testID="back-home"
					style={styles.headerBack}
					onPress={() => router.back()}
				>
					<Text style={styles.headerBackText}>← Back</Text>
				</Pressable>
				<Text style={styles.headerTitle}>Component Stack</Text>
			</View>

			<View style={styles.demoContainer}>
				<ComponentStackDemo />
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#333",
	},
	headerBack: {
		padding: 8,
	},
	headerBackText: {
		color: "#4a9eff",
		fontSize: 16,
	},
	headerTitle: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
		marginLeft: 16,
	},
	demoContainer: {
		flex: 1,
		margin: 16,
		borderRadius: 16,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#333",
	},
	screen: {
		flex: 1,
		backgroundColor: "#1e1e1e",
		padding: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	screenTitle: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 8,
	},
	screenSubtitle: {
		fontSize: 16,
		color: "#888",
		marginBottom: 32,
	},
	buttonGroup: {
		gap: 12,
		width: "100%",
		maxWidth: 280,
	},
	navButton: {
		backgroundColor: "#4a9eff",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	backButton: {
		backgroundColor: "#333",
	},
	navButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
