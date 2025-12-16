import { Pressable, StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";
import { createComponentNavigator } from "react-native-screen-transitions/component-stack";

const Stack = createComponentNavigator();

function HomeScreen({ navigation }: ComponentStackScreenProps) {
	return (
		<View style={styles.screen}>
			<Transition.View style={styles.content}>
				<Text style={styles.title}>Home Screen</Text>
				<Text style={styles.subtitle}>
					This navigation doesn't affect the URL
				</Text>

				<Pressable
					style={styles.button}
					onPress={() => navigation.push("Details")}
				>
					<Text style={styles.buttonText}>Go to Details</Text>
				</Pressable>

				<Pressable
					style={[styles.button, styles.buttonSecondary]}
					onPress={() => navigation.push("Settings")}
				>
					<Text style={styles.buttonText}>Go to Settings</Text>
				</Pressable>
			</Transition.View>
		</View>
	);
}

function DetailsScreen({ navigation }: ComponentStackScreenProps) {
	return (
		<View style={[styles.screen, styles.detailsScreen]}>
			<Transition.View style={styles.content}>
				<Text style={styles.title}>Details Screen</Text>
				<Text style={styles.subtitle}>Swipe down to go back</Text>

				<Pressable
					style={styles.button}
					onPress={() => navigation.push("Profile")}
				>
					<Text style={styles.buttonText}>Go to Profile</Text>
				</Pressable>

				<Pressable
					style={[styles.button, styles.buttonSecondary]}
					onPress={() => navigation.goBack()}
				>
					<Text style={styles.buttonText}>Go Back</Text>
				</Pressable>
			</Transition.View>
		</View>
	);
}

function ProfileScreen({ navigation }: ComponentStackScreenProps) {
	return (
		<View style={[styles.screen, styles.profileScreen]}>
			<Transition.View style={styles.content}>
				<Text style={styles.title}>Profile Screen</Text>
				<Text style={styles.subtitle}>Third level deep!</Text>

				<Pressable
					style={[styles.button, styles.buttonSecondary]}
					onPress={() => navigation.goBack()}
				>
					<Text style={styles.buttonText}>Go Back</Text>
				</Pressable>

				<Pressable
					style={[styles.button, styles.buttonDanger]}
					onPress={() => navigation.reset()}
				>
					<Text style={styles.buttonText}>Reset to Home</Text>
				</Pressable>
			</Transition.View>
		</View>
	);
}

function SettingsScreen({ navigation }: ComponentStackScreenProps) {
	return (
		<View style={[styles.screen, styles.settingsScreen]}>
			<Transition.View style={styles.content}>
				<Text style={styles.title}>Settings Screen</Text>

				<Pressable
					style={[styles.button, styles.buttonSecondary]}
					onPress={() => navigation.goBack()}
				>
					<Text style={styles.buttonText}>Go Back</Text>
				</Pressable>
			</Transition.View>
		</View>
	);
}

export default function App() {
	return (
		<View style={styles.container}>
			<Stack.Navigator initialRouteName="Home" screenOptions={{}}>
				<Stack.Screen name="Home" component={HomeScreen} />
				<Stack.Screen
					name="Details"
					component={DetailsScreen}
					options={{
						...Transition.Presets.SlideFromBottom(),
						gestureEnabled: true,
						gestureDirection: "vertical",
					}}
				/>
				<Stack.Screen
					name="Profile"
					component={ProfileScreen}
					options={{
						...Transition.Presets.SlideFromBottom(),
						gestureEnabled: true,
						gestureDirection: "vertical",
					}}
				/>
				<Stack.Screen
					name="Settings"
					component={SettingsScreen}
					options={{
						...Transition.Presets.SlideFromBottom(),
						gestureEnabled: true,
						gestureDirection: "vertical",
					}}
				/>
			</Stack.Navigator>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: 300,
		height: 300,
	},
	screen: {
		flex: 1,
		backgroundColor: "#1a1a2e",
		padding: 20,
		paddingTop: 60,
	},
	detailsScreen: {
		backgroundColor: "#16213e",
	},
	profileScreen: {
		backgroundColor: "#0f3460",
	},
	settingsScreen: {
		backgroundColor: "#2d132c",
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#888",
		marginBottom: 40,
	},
	button: {
		backgroundColor: "#e94560",
		paddingHorizontal: 32,
		paddingVertical: 16,
		borderRadius: 12,
		marginBottom: 16,
		minWidth: 200,
		alignItems: "center",
	},
	buttonSecondary: {
		backgroundColor: "#533483",
	},
	buttonDanger: {
		backgroundColor: "#c0392b",
	},
	buttonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
