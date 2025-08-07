import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "@/components/button";
import Page from "@/components/page";

export default function NestedA() {
	return (
		<Page
			title="Nested One"
			description="→ /nested/a"
			contentContainerStyle={{ flex: 1 }}
			scrollEnabled={false}
		>
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
				}}
			>
				<Text
					style={{
						fontSize: 14,
						color: "gray",
						fontWeight: "500",
						textAlign: "center",
						lineHeight: 20,
					}}
				>
					Swipe down → up to dismiss this stack and return to /
				</Text>
				<Button
					variant="solid"
					onPress={() => router.push("/nested/nested-two/a")}
				>
					/nested/nested-two/a ↑
				</Button>
				<Button variant="solid" onPress={() => router.push("/nested/b")}>
					/nested/b →
				</Button>
				<Button variant="ghost" onPress={router.back}>
					Back
				</Button>
			</View>
		</Page>
	);
}
