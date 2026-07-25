import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import { REVEAL_TRANSFORMED_SOURCE_ID } from "./constants";

export default function RevealTransformedSourceIndex() {
	const stackType = useResolvedStackType();
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
			<ScreenHeader
				title="Reveal transformed source"
				subtitle="Measure a boundary below a translated sheet-like ancestor."
			/>
			<View style={[styles.content, { transform: [{ translateY: 500 }] }]}>
				<View
					collapsable={false}
					style={[
						styles.sheetBackground,
						{ backgroundColor: theme.card },
					]}
				>
					<Transition.Boundary.Trigger
						id={REVEAL_TRANSFORMED_SOURCE_ID}
						style={[styles.sourceCard, { backgroundColor: theme.actionButton }]}
						onPress={() => {
							router.push(
								buildStackPath(
									stackType,
									"bounds/reveal-transformed-source/destination",
								) as never,
							);
						}}
					>
						<Text
							style={[styles.sourceTitle, { color: theme.actionButtonText }]}
						>
							Open Reveal
						</Text>
						<Text
							style={[styles.sourceHint, { color: theme.actionButtonText }]}
						>
							Source boundary
						</Text>
					</Transition.Boundary.Trigger>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	content: { flex: 1, gap: 18, padding: 16 },
	sheetBackground: {
		alignItems: "center",
		borderRadius: 28,
		gap: 18,
		padding: 28,
	},
	sourceCard: {
		alignItems: "center",
		borderRadius: 18,
		height: 96,
		justifyContent: "center",
		width: 168,
	},
	sourceTitle: { fontSize: 18, fontWeight: "800" },
	sourceHint: { fontSize: 12, fontWeight: "700", marginTop: 5, opacity: 0.82 },
});
