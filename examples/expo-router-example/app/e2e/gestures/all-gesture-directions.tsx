import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "@/components/button";
import Page from "@/components/page";

export default function AllGestureDirections() {
	return (
		<Page
			title="All Gesture Directions"
			description="Test all gesture directions (horizontal, vertical, inverted)"
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
				<View
					style={{
						backgroundColor: "#f0f0f0",
						padding: 20,
						borderRadius: 12,
						marginBottom: 20,
					}}
				>
					<Text
						style={{
							fontSize: 14,
							color: "#666",
							fontWeight: "500",
							textAlign: "center",
							lineHeight: 22,
						}}
					>
						This screen supports all gesture directions:{"\n"}• Swipe right →
						left (horizontal){"\n"}• Swipe left → right (horizontal-inverted)
						{"\n"}• Swipe bottom → top (vertical){"\n"}• Swipe top → bottom
						(vertical-inverted)
					</Text>
				</View>

				<Text
					style={{
						fontSize: 16,
						fontWeight: "600",
						color: "#333",
						textAlign: "center",
						marginBottom: 10,
					}}
				>
					Try swiping in any direction to dismiss
				</Text>

				<Button variant="ghost" onPress={router.back}>
					Back (Programmatic)
				</Button>
			</View>
		</Page>
	);
}
