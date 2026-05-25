import { router } from "expo-router";
import { Button, View } from "react-native";
import { useTheme } from "@/theme";

export default function ExampleIndex() {
	const theme = useTheme();
	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: theme.bg,
			}}
		>
			<Button
				title="Open Modal"
				onPress={() => router.push("/example/modal")}
			/>
		</View>
	);
}
