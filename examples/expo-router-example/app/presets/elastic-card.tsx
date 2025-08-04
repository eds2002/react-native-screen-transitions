import { StyleSheet, Text, View } from "react-native";
import Page from "@/components/page";

export default function ElasticCardPreset() {
	return (
		<Page
			contentContainerStyle={{
				alignItems: "center",
				justifyContent: "center",
				paddingTop: 0,
				flex: 1,
			}}
		>
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.title}>Elastic Card</Text>
					<Text style={styles.description}>
						This preset creates a rubber-band-like elastic movement with overlay
						effects and customizable elasticity. Drag me around.
					</Text>
				</View>
			</View>
		</Page>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 36,
		gap: 36,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "white",
		borderRadius: 36,
	},
	header: {
		gap: 2,
	},
	title: {
		fontSize: 24,
		fontWeight: "600",
		textAlign: "center",
	},
	description: {
		fontSize: 15,
		color: "gray",
		fontWeight: "400",
		textAlign: "center",
	},
});
