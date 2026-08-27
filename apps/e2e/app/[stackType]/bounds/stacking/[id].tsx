import { StackActions, useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";
import {
	parseStackDepth,
	STACKING_BUTTON_BOUNDARY_ID,
	STACKING_CARD_BOUNDARY_ID,
	type StackingBoundaryId,
} from "./constants";
import { StackingCardContent } from "./stacking-card-content";

export default function StackingBoundsDetail() {
	const { depth: depthParam, id: idParam } = useLocalSearchParams<{
		depth?: string | string[];
		id?: string | string[];
	}>();
	const depth = parseStackDepth(depthParam);
	const routeId = Array.isArray(idParam)
		? idParam[0]
		: (idParam ?? STACKING_CARD_BOUNDARY_ID);
	const navigation = useNavigation();
	const theme = useTheme();

	const pushIndex = (id: StackingBoundaryId) => {
		navigation.dispatch(
			StackActions.push("index", {
				depth: String(depth + 1),
				id,
			}),
		);
	};

	return (
		<SafeAreaView
			style={[styles.screen, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Dynamic detail"
				subtitle={`[id=${routeId}] · depth ${depth}`}
			/>

			<Transition.ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Pressable
					testID="stacking-detail-boundary"
					onPress={() => pushIndex(STACKING_CARD_BOUNDARY_ID)}
				>
					<Transition.Boundary.View
						id={STACKING_CARD_BOUNDARY_ID}
						escapeClipping
						style={styles.hero}
					>
						<StackingCardContent />
					</Transition.Boundary.View>
				</Pressable>

				<View style={styles.copy}>
					<Text style={[styles.title, { color: theme.text }]}>
						Pair isolation
					</Text>
					<Text style={[styles.body, { color: theme.textSecondary }]}>
						This route entered from {routeId}. Tap the card or black button to
						choose the source for the next index instance.
					</Text>
				</View>

				<Pressable
					testID="stacking-push-index"
					onPress={() => pushIndex(STACKING_BUTTON_BOUNDARY_ID)}
				>
					<Transition.Boundary.View
						id={STACKING_BUTTON_BOUNDARY_ID}
						escapeClipping
						style={[styles.button, { backgroundColor: theme.actionButton }]}
					>
						<Text
							style={[styles.buttonText, { color: theme.actionButtonText }]}
						>
							Push index again
						</Text>
						<Text
							style={[styles.buttonMeta, { color: theme.actionButtonText }]}
						>
							depth {depth + 1} →
						</Text>
					</Transition.Boundary.View>
				</Pressable>

				<Text style={[styles.hint, { color: theme.textTertiary }]}>
					Back pops normally · button keeps stacking
				</Text>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	body: {
		fontSize: 15,
		lineHeight: 22,
		marginTop: 8,
	},
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
	content: {
		gap: 26,
		paddingBottom: 48,
		paddingHorizontal: 18,
		paddingTop: 12,
	},
	copy: {
		paddingHorizontal: 4,
	},
	hero: {
		backgroundColor: "#172554",
		borderCurve: "continuous",
		borderRadius: 42,
		height: 390,
		overflow: "hidden",
	},
	hint: {
		fontFamily: "monospace",
		fontSize: 11,
		textAlign: "center",
	},
	screen: {
		flex: 1,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		letterSpacing: -0.5,
	},
});
