import { Tabs } from "expo-router";

export default function Layout() {
	return (
		<Tabs
			screenOptions={{
				headerShadowVisible: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Single",
				}}
			/>
			<Tabs.Screen
				name="nested"
				options={{
					title: "Nested",
					tabBarButtonTestID: "nested-tab",
				}}
			/>
		</Tabs>
	);
}
