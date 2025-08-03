import { router } from "expo-router";
import { useState } from "react";
import { Button, ScrollView, View } from "react-native";
import { BottomNav } from "@/components/bottom-nav";
import MainExample from "@/components/main-example";
import MocksExample from "@/components/mocks-example";

export default function Home() {
	const [activeSegment, setActiveSegment] = useState(0);
	return (
		<View style={{ backgroundColor: "white", flex: 1 }}>
			<Button
				title="Test"
				onPress={() => {
					router.push("/bounds-example");
				}}
			/>
			<Button
				title="Instagram"
				onPress={() => {
					router.push("/instagram-example");
				}}
			/>
			<ScrollView
				contentContainerStyle={{
					paddingVertical: 100,
					gap: 32,
				}}
			>
				{activeSegment === 0 ? <MainExample /> : <MocksExample />}
			</ScrollView>
			<BottomNav
				activeSegment={activeSegment}
				setActiveSegment={setActiveSegment}
			/>
		</View>
	);
}
