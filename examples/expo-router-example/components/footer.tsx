import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const Footer = ({ backIcon }: { backIcon?: string }) => {
	const { bottom } = useSafeAreaInsets();
	return (
		<View
			style={[styles.container, { paddingBottom: bottom }]}
			pointerEvents="box-none"
		>
			<View
				style={{ flexDirection: "row", gap: 12, width: "100%" }}
				pointerEvents="box-none"
			>
				{backIcon && (
					<TouchableOpacity
						onPress={() => router.back()}
						testID="back-icon"
						style={{
							width: 60,
							height: 60,
							backgroundColor: "black",
							borderRadius: 999,
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<FontAwesome6
							name={backIcon ? backIcon : "chevron-left"}
							size={24}
							color="white"
						/>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "flex-end",
		gap: 12,
		padding: 24,
	},
});
