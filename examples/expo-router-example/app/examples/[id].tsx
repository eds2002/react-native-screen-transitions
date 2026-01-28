import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";

export default function ExampleDetail() {
	const { top } = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id: string }>();

	return (
		<Transition.MaskedView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
			<View style={{ paddingTop: top + 20, paddingHorizontal: 20 }}>
				<Pressable
					onPress={() => router.back()}
					style={{
						paddingVertical: 8,
						paddingHorizontal: 12,
						backgroundColor: "#e2e8f0",
						borderRadius: 8,
						alignSelf: "flex-start",
					}}
				>
					<Text style={{ fontSize: 16, color: "#334155" }}>Back</Text>
				</Pressable>

				<View style={{ marginTop: 40, alignItems: "center" }}>
					<Text style={{ fontSize: 28, fontWeight: "700", color: "#0f172a" }}>
						Deep Link Example
					</Text>
					<Text
						style={{
							fontSize: 18,
							color: "#64748b",
							marginTop: 12,
							textAlign: "center",
						}}
					>
						You navigated here with id:
					</Text>
					<View
						style={{
							marginTop: 16,
							backgroundColor: "#3b82f6",
							paddingVertical: 12,
							paddingHorizontal: 24,
							borderRadius: 12,
						}}
					>
						<Text style={{ fontSize: 24, fontWeight: "600", color: "white" }}>
							{id}
						</Text>
					</View>
				</View>
			</View>
		</Transition.MaskedView>
	);
}
