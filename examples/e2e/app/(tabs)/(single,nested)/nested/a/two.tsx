import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";
import { StyleSheet, View } from "react-native";
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
			<Text style={s.unfocused}>┃ ┣━━ one.tsx</Text>
			<Text style={s.focused}>┃ ┗━━ ➡️ two.tsx</Text>
		</View>
	);
};

export default function Two() {
	return (
		<Transition.View style={styles.screenCentered}>
			<ScreenActions title={<Tree />} canGoBack />
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
