import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "@/components/button";
import Page from "@/components/page";

export default function VerticalScrollableGestures() {
	return (
		<Page
			title="Vertical Scrollable + Gestures"
			description="Testing gesture triggers with vertical scrollables"
		>
			<View
				style={{
					flex: 1,
					gap: 16,
				}}
			>
				<View
					style={{
						backgroundColor: "#f0f0f0",
						padding: 16,
						borderRadius: 12,
					}}
				>
					<Text
						style={{
							fontSize: 14,
							color: "#666",
							fontWeight: "600",
							textAlign: "center",
							lineHeight: 20,
							marginBottom: 8,
						}}
					>
						Gesture Activation Rules:
					</Text>

					<View style={{ gap: 6 }}>
						<Text style={{ fontSize: 12, color: "#666" }}>
							• At top: Bottom → Top triggers gesture
						</Text>
						<Text style={{ fontSize: 12, color: "#666" }}>
							• At bottom: Top → Bottom triggers gesture
						</Text>
					</View>
				</View>

				{Array.from({ length: 20 }, (_, i) => (
					<View
						key={i.toString()}
						style={{
							height: 80,
							marginHorizontal: 20,
							marginVertical: 10,
							backgroundColor: i % 2 === 0 ? "#f8f8f8" : "#e8e8e8",
							borderRadius: 8,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Text style={{ fontSize: 16, fontWeight: "600", color: "#666" }}>
							Item {i + 1}
						</Text>
						<Text style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
							Scroll to test gesture triggers
						</Text>
					</View>
				))}
				<Button variant="ghost" onPress={router.back}>
					Back (Programmatic)
				</Button>
			</View>
		</Page>
	);
}
