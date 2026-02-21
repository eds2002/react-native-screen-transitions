import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { ZOOM_ITEMS } from "./constants";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";

export default function ZoomIndex() {
	const stackType = useResolvedStackType();
	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<ScreenHeader title="Zoom" subtitle="bounds({ id }).navigation.zoom()" />
			<View style={styles.list}>
				{ZOOM_ITEMS.map((item) => (
					<Pressable
						key={item.id}
						onPress={() => router.push(buildStackPath(stackType, `zoom/${item.id}`) as never)}
					>
						<Transition.Boundary
							id={item.id}
							mode="source"
							style={[styles.card, { backgroundColor: item.color }]}
						>
							<Text style={styles.title}>{item.title}</Text>
							<Text style={styles.subtitle}>{item.subtitle}</Text>
						</Transition.Boundary>
					</Pressable>
				))}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0D0D0D",
	},
	list: {
		paddingHorizontal: 16,
		paddingBottom: 24,
		gap: 14,
	},
	card: {
		height: 160,
		borderRadius: 24,
		padding: 18,
		justifyContent: "flex-end",
		overflow: "hidden",
	},
	title: {
		color: "#fff",
		fontSize: 22,
		fontWeight: "700",
	},
	subtitle: {
		marginTop: 4,
		color: "rgba(255,255,255,0.85)",
		fontSize: 13,
		fontWeight: "500",
	},
});
