import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "@/components/button";
import Page from "@/components/page";

export default function GestureDismissal() {
	return (
		<Page
			title="Gesture Dismissal Logic"
			description="Testing vertical gesture dismissal behavior"
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
						width: "100%",
					}}
				>
					<Text
						style={{
							fontSize: 14,
							color: "#666",
							fontWeight: "600",
							textAlign: "center",
							lineHeight: 22,
							marginBottom: 12,
						}}
					>
						Vertical Gesture Dismissal Rules:
					</Text>

					<View style={{ gap: 8 }}>
						<View
							style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
						>
							<Text style={{ fontSize: 20 }}>✅</Text>
							<Text style={{ fontSize: 13, color: "#666", flex: 1 }}>
								Top → Bottom swipe: Dismisses screen
							</Text>
						</View>

						<View
							style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
						>
							<Text style={{ fontSize: 20 }}>✅</Text>
							<Text style={{ fontSize: 13, color: "#666", flex: 1 }}>
								Extreme Left ↔️ Right swipe: Dismisses screen
							</Text>
						</View>

						<View
							style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
						>
							<Text style={{ fontSize: 20 }}>↩️</Text>
							<Text style={{ fontSize: 13, color: "#666", flex: 1 }}>
								Bottom → Top swipe: Resets to original position
							</Text>
						</View>
					</View>
				</View>

				<View
					style={{
						width: 250,
						height: 300,
						borderWidth: 2,
						borderColor: "#ddd",
						borderRadius: 12,
						backgroundColor: "#fff",
						padding: 20,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text style={{ fontSize: 48, marginBottom: 16 }}>📱</Text>
					<Text
						style={{
							fontSize: 14,
							color: "#666",
							textAlign: "center",
							lineHeight: 20,
						}}
					>
						Try different swipe gestures{"\n"}to test dismissal logic
					</Text>

					<View style={{ marginTop: 20, gap: 8 }}>
						<Text style={{ fontSize: 12, color: "#999", textAlign: "center" }}>
							↓ Swipe down to dismiss
						</Text>
						<Text style={{ fontSize: 12, color: "#999", textAlign: "center" }}>
							↑ Swipe up to reset
						</Text>
					</View>
				</View>

				<Button variant="ghost" onPress={router.back}>
					Back (Programmatic)
				</Button>
			</View>
		</Page>
	);
}
