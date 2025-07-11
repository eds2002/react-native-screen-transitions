import { Link, router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export default function A() {
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "white",
				alignItems: "center",
				justifyContent: "center",
				gap: 8,
			}}
		>
			<Link
				href="/group-a/b"
				style={{ fontSize: 16, fontWeight: "500", color: "blue" }}
			>
				Go to /group-a/b
			</Link>
			<Pressable onPress={router.back}>
				<Text style={{ fontSize: 14, fontWeight: "500", opacity: 0.5 }}>
					Go back ( or swipe left to right)
				</Text>
			</Pressable>
		</View>
	);
}
