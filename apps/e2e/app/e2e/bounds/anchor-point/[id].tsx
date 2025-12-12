import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function AnchorPointScreen() {
	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Transition.Pressable
				sharedBoundTag="anchor-point"
				testID="anchor-point"
				style={{ width: 100, height: 100, backgroundColor: "red" }}
				onPress={router.back}
			/>
			<View
				style={[
					StyleSheet.absoluteFillObject,
					{ alignItems: "center", justifyContent: "center" },
				]}
				pointerEvents="none"
			>
				<View
					style={{
						width: 100,
						height: 100,
						borderColor: "blue",
						borderWidth: 1,
					}}
				/>
			</View>
		</View>
	);
}
