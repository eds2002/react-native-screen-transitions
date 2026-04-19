import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

const ICON_SIZE = 22;

export default function SharedAppleMusicTabsLayout() {
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: "#EF4444",
				tabBarInactiveTintColor: "#9CA3AF",
				tabBarStyle: {
					backgroundColor: "#FFF",
					borderTopColor: "rgba(0,0,0,0.06)",
				},
				tabBarLabelStyle: {
					fontSize: 11,
					fontWeight: "600",
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="home"
							size={ICON_SIZE}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="new"
				options={{
					title: "New",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="view-grid"
							size={ICON_SIZE}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="radio"
				options={{
					title: "Radio",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="radio-tower"
							size={ICON_SIZE}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="library"
				options={{
					title: "Library",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							name="library"
							size={ICON_SIZE}
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					title: "Search",
					tabBarIcon: ({ color }) => (
						<FontAwesome
							name="search"
							size={ICON_SIZE}
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
