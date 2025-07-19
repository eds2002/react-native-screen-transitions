import { router } from "expo-router";

import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Group } from "../components/group";
import { mocksExampleGroups } from "../constants";

export default function MocksExample() {
	const { height } = useWindowDimensions();
	return (
		<View style={{ flex: 1, gap: 12, height: height }}>
			<View style={{ gap: 2, paddingHorizontal: 36 }}>
				<Text style={{ fontSize: 18, fontWeight: "600" }}>Mock Examples</Text>
				<Text style={{ fontSize: 13, color: "gray" }}>
					Sample screen pages with custom transitions.
				</Text>
			</View>

			{Object.entries(mocksExampleGroups).map(([key, group]) => (
				<View
					key={key}
					style={{ width: "100%", gap: 12, paddingHorizontal: 36 }}
				>
					<Group key={group.href} onPress={() => router.push(group.href)}>
						<Text style={styles.link}>{group.label}</Text>
						<Text style={styles.dimmed}>{group.desc}</Text>
					</Group>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: 12,
	},

	link: {
		fontSize: 16,
		fontWeight: "500",
	},
	separator: {
		marginVertical: 30,
		height: 1,
		width: "80%",
	},
	dimmed: {
		fontSize: 13,
		color: "gray",
	},
});
