import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { getZoomItemById } from "./constants";

export default function ZoomDetail() {
	const { width } = useWindowDimensions();
	const { id } = useLocalSearchParams<{ id: string }>();
	const item = getZoomItemById(id);

	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<ScreenHeader title="Zoom Detail" subtitle={item.title} />
			<Transition.ScrollView contentContainerStyle={styles.content}>
				<Transition.Boundary
					id={item.id}
					// anchor="top"
					// scaleMode="uniform"
					style={[
						styles.hero,
						{ backgroundColor: item.color, width: width - 32 },
					]}
				>
					<Text style={styles.heroTitle}>{item.title}</Text>
				</Transition.Boundary>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Navigation Zoom</Text>
					<Text style={styles.sectionBody}>
						This screen uses the new composed API:
					</Text>
					<Text style={styles.codeLine}>
						bounds.match({`{ id }`}).navigation.zoom()
					</Text>
					<Text style={styles.sectionBody}>
						The mask host is injected automatically by the container when the
						navigation zoom styles are present.
					</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Try this</Text>
					<Text style={styles.sectionBody}>
						Swipe down to dismiss and watch the reverse zoom back into the
						source card.
					</Text>
				</View>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#111111",
	},
	content: {
		paddingHorizontal: 16,
		paddingBottom: 40,
		gap: 20,
	},
	hero: {
		height: 260,
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
	section: {
		backgroundColor: "#1C1C1C",
		borderRadius: 18,
		padding: 16,
		borderWidth: 1,
		borderColor: "#2E2E2E",
		gap: 8,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#fff",
	},
	sectionBody: {
		fontSize: 14,
		lineHeight: 20,
		color: "#BDBDBD",
	},
	codeLine: {
		fontSize: 13,
		color: "#F2F2F2",
		fontFamily: "Courier",
	},
});
