import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";

const ICON_SIZE = 26;

export default function TabLayout() {
	return (
		<Tabs screenOptions={{ tabBarActiveTintColor: "red" }}>
			<Tabs.Screen
				name="(home)"
				options={{
					title: "Home",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							size={ICON_SIZE}
							name="home"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="(new)"
				options={{
					title: "New",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							size={ICON_SIZE}
							name="view-grid"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="(radio)"
				options={{
					title: "Radio",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							size={ICON_SIZE}
							name="radio-tower"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="(library)"
				options={{
					title: "Library",
					tabBarIcon: ({ color }) => (
						<MaterialCommunityIcons
							size={ICON_SIZE}
							name="library"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="(search)"
				options={{
					title: "Search",
					tabBarIcon: ({ color }) => (
						<FontAwesome size={ICON_SIZE} name="search" color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
