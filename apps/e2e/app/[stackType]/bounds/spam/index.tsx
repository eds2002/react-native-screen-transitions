import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

const COLUMNS = 4;
const ROWS = 4;

const ITEMS = Array.from({ length: COLUMNS * ROWS }, (_, i) => ({
	id: `spam-${i}`,
	label: `${i + 1}`,
	color: `hsl(${i * 22.5}, 80%, 55%)`,
}));

export default function BoundsSpamIndex() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader
				title="Bounds Spam"
				subtitle="Tap rapidly — same item or different items"
			/>
			<View style={styles.content}>
				{Array.from({ length: ROWS }).map((_, rowIdx) => (
					<View key={`row-${rowIdx}`} style={styles.row}>
						{Array.from({ length: COLUMNS }).map((_, colIdx) => {
							const item = ITEMS[rowIdx * COLUMNS + colIdx];
							return (
								<Pressable
									key={item.id}
									style={styles.cell}
									onPress={() => {
										router.push(
											buildStackPath(
												stackType,
												`bounds/spam/${item.id}`,
											) as never,
										);
									}}
								>
									<Transition.Boundary.View
										id={item.id}
										style={[styles.boundary, { backgroundColor: item.color }]}
									>
										<Text style={styles.label}>{item.label}</Text>
									</Transition.Boundary.View>
								</Pressable>
							);
						})}
					</View>
				))}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		padding: 12,
		gap: 8,
		justifyContent: "center",
	},
	row: {
		flexDirection: "row",
		gap: 8,
	},
	cell: {
		flex: 1,
		aspectRatio: 1,
	},
	boundary: {
		flex: 1,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	label: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 20,
	},
});
