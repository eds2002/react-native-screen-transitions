import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { getBoundsSyncZoomItemById } from "../zoom.constants";

export default function BoundsSyncZoomDetail() {
	const { width } = useWindowDimensions();
	const { id } = useLocalSearchParams<{ id: string }>();
	const item = getBoundsSyncZoomItemById(id);

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: item.bgColor }]}
			edges={["top"]}
		>
			<ScreenHeader title={item.title} subtitle={item.subtitle} />

			<Transition.ScrollView contentContainerStyle={styles.content}>
				<View
					style={[
						styles.hero,
						{ backgroundColor: item.color, width: width - 32 },
					]}
				>
					<Text style={styles.heroTitle}>{item.title}</Text>
					<Text style={styles.heroSubtitle}>{item.subtitle}</Text>
				</View>

				<View style={[styles.section, { borderColor: `${item.color}22` }]}>
					<Text style={styles.sectionTitle}>About</Text>
					<Text style={styles.sectionBody}>{item.description}</Text>
				</View>

				<View style={[styles.section, { borderColor: `${item.color}22` }]}>
					<Text style={styles.sectionTitle}>Transition</Text>
					<Text style={styles.codeLine}>
						bounds({`{ id: "${item.id}" }`}).navigation.zoom()
					</Text>
					<Text style={styles.sectionBody}>
						Swipe in any direction to dismiss and observe the reverse zoom back
						into the source boundary.
					</Text>
				</View>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 16,
		paddingBottom: 40,
		gap: 16,
	},
	hero: {
		height: 250,
		borderRadius: 28,
		alignSelf: "center",
		justifyContent: "flex-end",
		padding: 20,
		overflow: "hidden",
	},
	heroTitle: {
		fontSize: 30,
		fontWeight: "800",
		color: "#fff",
	},
	heroSubtitle: {
		marginTop: 4,
		fontSize: 15,
		fontWeight: "500",
		color: "rgba(255,255,255,0.7)",
	},
	section: {
		backgroundColor: "rgba(255,255,255,0.04)",
		borderRadius: 18,
		padding: 16,
		borderWidth: 1,
		gap: 8,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#fff",
	},
	sectionBody: {
		fontSize: 14,
		lineHeight: 22,
		color: "rgba(255,255,255,0.65)",
	},
	codeLine: {
		fontSize: 13,
		color: "rgba(255,255,255,0.85)",
		fontFamily: "Courier",
	},
});
