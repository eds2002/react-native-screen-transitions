import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import {
	parseStackDepth,
	STACKING_BUTTON_BOUNDARY_ID,
	STACKING_CARD_BOUNDARY_ID,
	type StackingBoundaryId,
} from "@/components/bounds-stacking/constants";
import { StackingCardContent } from "@/components/bounds-stacking/stacking-card-content";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

export default function StackingBoundsIndex() {
	const { depth: depthParam } = useLocalSearchParams<{
		depth?: string | string[];
	}>();
	const depth = parseStackDepth(depthParam);
	const stackType = useResolvedStackType();
	const theme = useTheme();

	const pushDetail = (id: StackingBoundaryId) => {
		router.push({
			pathname: buildStackPath(stackType, "bounds/stacking/[id]"),
			params: {
				depth: String(depth + 1),
				id,
			},
		} as never);
	};

	return (
		<SafeAreaView
			style={[styles.screen, { backgroundColor: theme.bg }]}
			edges={["top"]}
			testID={`stacking-index-depth-${depth}`}
		>
			<ScreenHeader
				title="Stacking bounds"
				subtitle={`Index instance · depth ${depth}`}
			/>

			<Transition.ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Transition.Boundary.Host />

				<View style={[styles.explainer, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.explainerLabel, { color: theme.infoBoxLabel }]}>
						CURRENT ROUTE INSTANCE
					</Text>
					<Text style={[styles.route, { color: theme.text }]}>index</Text>
					<Text style={[styles.explainerText, { color: theme.textSecondary }]}>
						Tap either bound below. The selected id decides whether Zoom starts
						from the card or the button.
					</Text>
				</View>

				<Pressable
					testID="stacking-index-boundary"
					onPress={() => pushDetail(STACKING_CARD_BOUNDARY_ID)}
				>
					<Transition.Boundary
						id={STACKING_CARD_BOUNDARY_ID}
						escapeClipping
						style={styles.card}
					>
						<StackingCardContent compact />
					</Transition.Boundary>
				</Pressable>

				<Pressable
					testID="stacking-index-button"
					onPress={() => pushDetail(STACKING_BUTTON_BOUNDARY_ID)}
				>
					<Transition.Boundary
						id={STACKING_BUTTON_BOUNDARY_ID}
						escapeClipping
						style={[styles.button, { backgroundColor: theme.actionButton }]}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Push from button
						</Text>
						<Text
							style={[styles.buttonMeta, { color: theme.actionButtonText }]}
						>
							depth {depth + 1} →
						</Text>
					</Transition.Boundary>
				</Pressable>

				<Text style={[styles.hint, { color: theme.textTertiary }]}>
					Both paths push the same dynamic screen
				</Text>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	button: {
		alignItems: "center",
		borderCurve: "continuous",
		borderRadius: 18,
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 18,
		paddingVertical: 16,
	},
	buttonMeta: {
		fontFamily: "monospace",
		fontSize: 12,
		opacity: 0.68,
	},
	buttonText: {
		fontSize: 15,
		fontWeight: "700",
	},
	card: {
		backgroundColor: "#172554",
		borderCurve: "continuous",
		borderRadius: 28,
		height: 250,
		overflow: "hidden",
	},
	content: {
		gap: 28,
		paddingBottom: 48,
		paddingHorizontal: 18,
		paddingTop: 12,
	},
	explainer: {
		borderCurve: "continuous",
		borderRadius: 18,
		padding: 16,
	},
	explainerLabel: {
		fontSize: 10,
		fontWeight: "700",
		letterSpacing: 1.2,
	},
	explainerText: {
		fontSize: 13,
		lineHeight: 19,
		marginTop: 8,
	},
	hint: {
		fontFamily: "monospace",
		fontSize: 12,
		textAlign: "center",
	},
	route: {
		fontFamily: "monospace",
		fontSize: 20,
		fontWeight: "700",
		marginTop: 5,
	},
	screen: {
		flex: 1,
	},
});
