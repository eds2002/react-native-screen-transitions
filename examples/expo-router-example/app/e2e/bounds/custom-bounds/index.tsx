import { router } from "expo-router";
import { Button, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function AnchorPointScreen() {
	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Transition.View
				sharedBoundTag="custom-bounds"
				testID="custom-bounds"
				style={{
					width: 200,
					height: 200,
					backgroundColor: "lightblue",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Text>Custom Bounds</Text>
			</Transition.View>
			<View style={{ flexDirection: "column", gap: 10 }}>
				<Button
					title="Custom Bounds"
					testID="custom-bounds-button"
					onPress={() => {
						router.push({
							pathname: "/e2e/bounds/custom-bounds/[id]",
							params: { id: "custom-bounds" },
						});
					}}
				/>
			</View>
		</View>
	);
}
