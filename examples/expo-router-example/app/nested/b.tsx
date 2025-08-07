import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "@/components/button";
import Page from "@/components/page";

export default function NestedB() {
	return (
		<Page
			title="Nested One"
			description="→ /nested/b"
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
					1) Drag left → right to go back within this stack.
					{"\n"}
					2) Swipe down → up to dismiss this stack and return to /.
				</Text>
				<Button onPress={router.back}>Back </Button>
			</View>
		</Page>
	);
}
