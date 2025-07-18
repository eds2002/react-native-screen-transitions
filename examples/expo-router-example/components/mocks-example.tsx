import { router } from "expo-router";
import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Group } from "../components/group";
import { mocksExampleGroups } from "../constants";

export default function MocksExample() {
	return (
		<Fragment>
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
		</Fragment>
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
