import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import { router } from "expo-router";
import { Button, StyleSheet, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { Text } from "react-native";

const Tree = () => {
	return (
		<View style={{ alignItems: "flex-start" }}>
			<Text style={s.unfocused}>┣━━ a</Text>
			<Text style={s.unfocused}>┃ ┣━━ b</Text>
			<Text style={s.unfocused}>┃ ┃ ┣━━ _layout.tsx</Text>
			<Text style={s.unfocused}>┃ ┃ ┣━━ one.tsx</Text>
			<Text style={s.unfocused}>┃ ┃ ┗━━ two.tsx</Text>
			<Text style={s.unfocused}>┃ ┣━━ _layout.tsx</Text>
			<Text style={s.focused}>┃ ┣━━ ➡️ one.tsx</Text>
			<Text style={s.unfocused}>┃ ┗━━ two.tsx</Text>
		</View>
	);
};

export default function AIndex() {
	return (
		<Transition.View style={styles.screenCentered} testID="a-one">
			<ScreenActions title={<Tree />} canGoBack nextHref="/nested/a/b/one" />
			<Button
				title="Go to nested/a/two"
				onPress={() => router.push("/nested/a/two")}
			/>
		</Transition.View>
	);
}

const s = StyleSheet.create({
	focused: {
		fontWeight: "600",
		fontSize: 18,
	},
	unfocused: {
		fontSize: 16,
		color: "#999",
		fontWeight: "500",
	},
});
