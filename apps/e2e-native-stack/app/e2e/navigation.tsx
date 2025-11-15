import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import Button from "@/components/button";
import Page from "@/components/page";

export default function Navigation() {
	const [pushCount, setPushCount] = useState(0);

	return (
		<Page
			title="Push/Back Navigation"
			description="Testing navigation events such as push/back"
			contentContainerStyle={{ flex: 1 }}
			scrollEnabled={false}
		>
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					gap: 16,
				}}
			>
				<Text
					style={{
						fontSize: 14,
						color: "gray",
						fontWeight: "500",
						textAlign: "center",
						lineHeight: 20,
						marginBottom: 20,
					}}
				>
					Test push and back navigation animations
				</Text>

				<Text
					style={{
						fontSize: 18,
						fontWeight: "600",
						marginBottom: 8,
					}}
				>
					Push Count: {pushCount}
				</Text>

				<Button
					variant="solid"
					onPress={() => {
						setPushCount((prev) => prev + 1);
						router.push("/e2e/navigation");
					}}
				>
					Push Same Screen
				</Button>

				<Button variant="ghost" onPress={() => router.back()}>
					Back
				</Button>
			</View>
		</Page>
	);
}
