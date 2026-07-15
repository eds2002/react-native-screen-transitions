import {
	createNativeStackNavigator,
	type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition, {
	type ScreenTransitionConfig,
	useScreenAnimation,
	withScreenTransitions,
} from "react-native-screen-transitions";

type ParamList = {
	Home: undefined;
	ScreenLayout: undefined;
	GroupLayout: undefined;
};

const Stack = withScreenTransitions(createNativeStackNavigator<ParamList>());

const transitionOptions = {
	enableTransitions: true,
	screenStyleInterpolator: (({ progress }) => {
		"worklet";

		return {
			content: {
				style: {
					opacity: progress,
				},
			},
		};
	}) satisfies ScreenTransitionConfig["screenStyleInterpolator"],
	transitionSpec: {
		open: Transition.Specs.DefaultSpec,
		close: Transition.Specs.DefaultSpec,
	},
};

function ScreenLayout({ children }: { children: ReactElement }) {
	return (
		<SafeAreaView style={styles.layout} testID="adapter-screen-layout-wrapper">
			<Text style={styles.layoutLabel}>Screen.layout active</Text>
			{children}
		</SafeAreaView>
	);
}

function GroupLayout({ children }: { children: ReactElement }) {
	return (
		<SafeAreaView style={styles.layout} testID="adapter-group-layout-wrapper">
			<Text style={styles.layoutLabel}>Group.screenLayout active</Text>
			{children}
		</SafeAreaView>
	);
}

function HomeScreen({
	navigation,
}: NativeStackScreenProps<ParamList, "Home">) {
	return (
		<SafeAreaView style={styles.screen}>
			<View style={styles.content}>
				<Text style={styles.title}>Adapter Layout Overrides</Text>
				<Text style={styles.description}>
					Each destination consumes the screen animation context beneath a custom
					React Navigation layout.
				</Text>
				<Pressable
					testID="adapter-open-screen-layout"
					style={styles.button}
					onPress={() => navigation.navigate("ScreenLayout")}
				>
					<Text style={styles.buttonText}>Open Screen Layout</Text>
				</Pressable>
				<Pressable
					testID="adapter-open-group-layout"
					style={styles.button}
					onPress={() => navigation.navigate("GroupLayout")}
				>
					<Text style={styles.buttonText}>Open Group Layout</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

function DestinationScreen({
	navigation,
	kind,
}: {
	navigation: { goBack: () => void };
	kind: "screen" | "group";
}) {
	useScreenAnimation();

	return (
		<View style={styles.destination}>
			<Text
				style={styles.title}
				testID={`adapter-${kind}-layout-destination`}
			>
				Provider active
			</Text>
			<Pressable
				testID={`adapter-close-${kind}-layout`}
				style={styles.button}
				onPress={navigation.goBack}
			>
				<Text style={styles.buttonText}>Close</Text>
			</Pressable>
		</View>
	);
}

function ScreenLayoutDestination({
	navigation,
}: NativeStackScreenProps<ParamList, "ScreenLayout">) {
	return <DestinationScreen kind="screen" navigation={navigation} />;
}

function GroupLayoutDestination({
	navigation,
}: NativeStackScreenProps<ParamList, "GroupLayout">) {
	return <DestinationScreen kind="group" navigation={navigation} />;
}

export default function NativeStackAdapterLayoutRecipe() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="Home" component={HomeScreen} />
			<Stack.Screen
				name="ScreenLayout"
				component={ScreenLayoutDestination}
				layout={ScreenLayout}
				options={transitionOptions}
			/>
			<Stack.Group screenLayout={GroupLayout}>
				<Stack.Screen
					name="GroupLayout"
					component={GroupLayoutDestination}
					options={transitionOptions}
				/>
			</Stack.Group>
		</Stack.Navigator>
	);
}

const styles = StyleSheet.create({
	layout: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	layoutLabel: {
		paddingHorizontal: 20,
		paddingVertical: 10,
		backgroundColor: "#166534",
		color: "#ffffff",
		fontSize: 13,
		fontWeight: "700",
		textAlign: "center",
	},
	screen: {
		flex: 1,
		backgroundColor: "#ffffff",
	},
	content: {
		flex: 1,
		justifyContent: "center",
		padding: 24,
		gap: 16,
	},
	destination: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 24,
		backgroundColor: "#f3f4f6",
	},
	title: {
		color: "#111827",
		fontSize: 24,
		fontWeight: "800",
		textAlign: "center",
	},
	description: {
		color: "#4b5563",
		fontSize: 15,
		lineHeight: 22,
		textAlign: "center",
	},
	button: {
		minHeight: 48,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 8,
		backgroundColor: "#111827",
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	buttonText: {
		color: "#ffffff",
		fontSize: 15,
		fontWeight: "700",
	},
});
