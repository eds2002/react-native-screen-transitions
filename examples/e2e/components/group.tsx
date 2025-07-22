import { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { styles as gs } from "../global.styles";
import { Link } from "expo-router";
import type { SettingsConfig } from "../types";

interface GroupProps extends SettingsConfig {}

export const Group = ({ title, description, routes }: GroupProps) => {
	const renderItem = useCallback(
		({
			item,
		}: { item: { title: string; description: string; href: string } }) => {
			return (
				<Link href={item.href as never} testID={item.title}>
					<View style={styles.item}>
						<Text style={styles.title}>{item.title}</Text>
						<Text style={styles.description}>{item.description}</Text>
					</View>
				</Link>
			);
		},
		[],
	);
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={gs.title}>{title}</Text>
				<Text style={gs.description}>{description}</Text>
			</View>
			<FlatList
				data={routes}
				renderItem={renderItem}
				contentContainerStyle={styles.contentContainer}
				scrollEnabled={false}
				style={{ flexGrow: 0 }}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		gap: 4,
	},
	container: {
		borderRadius: 24,
		backgroundColor: "#f3f4f6",
		padding: 16,
		gap: 16,
	},
	title: {
		fontSize: 14,
		fontWeight: "600",
	},
	description: {
		fontSize: 13,
		fontWeight: "500",
		opacity: 0.7,
	},
	item: {
		padding: 12,
		width: "100%",
		borderRadius: 16,
		backgroundColor: "#e5e7eb",
	},
	contentContainer: {
		gap: 6,
		alignItems: "flex-start",
		justifyContent: "flex-start",
		flex: 0,
	},
});
