import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import Button from "@/components/button";
import Page from "@/components/page";

export default function BiDirectionalGestures() {
	const [gestureAttempts, setGestureAttempts] = useState({
		horizontal: 0,
		vertical: 0,
		horizontalInverted: 0,
		verticalInverted: 0,
	});

	return (
		<Page
			title="Bi-directional Gestures"
			description="Test bi-directional gesture support"
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
							fontWeight: "500",
							textAlign: "center",
							lineHeight: 22,
							marginBottom: 16,
						}}
					>
						Bi-directional gestures enabled for all directions
					</Text>

					<View style={{ gap: 8 }}>
						<Text style={{ fontSize: 12, color: "#888" }}>
							Gesture Tracking (for testing):
						</Text>
						<Text style={{ fontSize: 12, color: "#666" }}>
							• Horizontal (→): {gestureAttempts.horizontal} attempts
						</Text>
						<Text style={{ fontSize: 12, color: "#666" }}>
							• Vertical (↑): {gestureAttempts.vertical} attempts
						</Text>
						<Text style={{ fontSize: 12, color: "#666" }}>
							• Horizontal Inverted (←): {gestureAttempts.horizontalInverted}{" "}
							attempts
						</Text>
						<Text style={{ fontSize: 12, color: "#666" }}>
							• Vertical Inverted (↓): {gestureAttempts.verticalInverted}{" "}
							attempts
						</Text>
					</View>
				</View>

				<View
					style={{
						position: "relative",
						width: 200,
						height: 200,
						borderWidth: 2,
						borderColor: "#ddd",
						borderRadius: 12,
						alignItems: "center",
						justifyContent: "center",
					}}
					onTouchStart={() => {
						// This is just for visual feedback, actual gesture handling is done by the navigation
						setGestureAttempts((prev) => ({
							...prev,
							horizontal: prev.horizontal + 0.1,
						}));
					}}
				>
					<Text style={{ fontSize: 24, marginBottom: 8 }}>↔️ ↕️</Text>
					<Text
						style={{
							fontSize: 12,
							color: "#666",
							textAlign: "center",
						}}
					>
						Swipe in any direction
					</Text>
				</View>

				<Button variant="ghost" onPress={router.back}>
					Back (Programmatic)
				</Button>
			</View>
		</Page>
	);
}
