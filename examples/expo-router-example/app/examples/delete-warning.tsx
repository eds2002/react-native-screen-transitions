import { router } from "expo-router";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function DeleteWarning() {
	const { height } = useWindowDimensions();

	const fifthHeight = height / 5;
	return (
		<Transition.ScrollView
			contentContainerStyle={{
				height: fifthHeight,
				marginTop: "auto",
			}}
			bounces={false}
			showsVerticalScrollIndicator={false}
		>
			<Transition.View>
				<View
					style={{
						backgroundColor: "black",
						height: fifthHeight,
						padding: 16,
						justifyContent: "center",
						alignItems: "center",
						marginTop: "auto",
						borderTopLeftRadius: 36,
						borderTopRightRadius: 36,
						overflow: "hidden",
					}}
				>
					<View style={{ gap: 12, alignItems: "center", width: "100%" }}>
						<View style={{ gap: 4, width: "100%", alignItems: "center" }}>
							<Text
								style={{ fontSize: 20, fontWeight: "bold", color: "white" }}
							>
								Delete Warning
							</Text>
							<Text
								style={{
									fontSize: 14,
									color: "white",
									textAlign: "center",
									opacity: 0.7,
								}}
							>
								Are you sure you want to delete whatever this is supposed to be?
							</Text>
						</View>
						<Pressable
							onPress={() => router.back()}
							style={{
								paddingHorizontal: 48,
								paddingVertical: 12,
								alignItems: "center",
								justifyContent: "center",
								backgroundColor: "#ef4444",
								borderRadius: 100,
							}}
						>
							<Text style={{ fontSize: 16, color: "white", fontWeight: "600" }}>
								Cancel
							</Text>
						</Pressable>
					</View>
				</View>
			</Transition.View>
		</Transition.ScrollView>
	);
}
