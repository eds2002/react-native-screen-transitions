import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import {
	TRANSITION_SCOPE_BOUNDARY_ID,
	TRANSITION_SCOPE_META_ID,
	TRANSITION_SCOPE_PHOTO,
	TRANSITION_SCOPE_TITLE_ID,
} from "./constants";

export default function TransitionScopeIndex() {
	const stackType = useResolvedStackType();
	const theme = useTheme();

	return (
		<SafeAreaView
			edges={["top"]}
			style={[styles.container, { backgroundColor: theme.bg }]}
		>
			<ScreenHeader
				title="Transition Scope"
				subtitle="Parent-owned bounds into a nested route"
			/>
			<ScrollView
				contentContainerStyle={styles.content}
				style={styles.scroll}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.copyBlock}>
					<Text style={[styles.kicker, { color: theme.textSecondary }]}>
						Parent route
					</Text>
					<Text style={[styles.title, { color: theme.text }]}>
						Open the nested detail
					</Text>
					<Text style={[styles.description, { color: theme.textSecondary }]}>
						The destination lives in a child stack, while each navigator layout
						computes matching bounds for every registered slot.
					</Text>
				</View>

				<Transition.Boundary.Trigger
					id={TRANSITION_SCOPE_BOUNDARY_ID}
					testID={TRANSITION_SCOPE_BOUNDARY_ID}
					style={[styles.featureRow, { backgroundColor: theme.card }]}
					onPress={() => {
						router.push(
							buildStackPath(
								stackType,
								"bounds/transition-scope/nested",
							) as never,
						);
					}}
				>
					<Transition.Boundary.Target style={styles.thumbnail}>
						<Image
							source={TRANSITION_SCOPE_PHOTO}
							style={styles.image}
							contentFit="cover"
						/>
					</Transition.Boundary.Target>
					<View style={styles.rowText}>
						<Transition.Boundary.View
							id={TRANSITION_SCOPE_TITLE_ID}
							style={styles.rowTitleBound}
						>
							<Text style={[styles.rowTitle, { color: theme.text }]}>
								Open nested bound chain
							</Text>
						</Transition.Boundary.View>
						<Transition.Boundary.View
							id={TRANSITION_SCOPE_META_ID}
							style={[styles.metaPill, { backgroundColor: theme.actionButton }]}
						>
							<Text style={[styles.metaPillText, { color: theme.bg }]}>
								3 linked bounds
							</Text>
						</Transition.Boundary.View>
						<Text
							numberOfLines={2}
							style={[styles.rowSubtitle, { color: theme.textSecondary }]}
						>
							First push enters level 2. The next tap pushes level 3 with the
							same public boundary API.
						</Text>
					</View>
					<Text style={[styles.chevron, { color: theme.textTertiary }]}>
						&gt;
					</Text>
				</Transition.Boundary.Trigger>

				<View style={styles.notes}>
					{[
						"Photo, title, and badge are separate bounds",
						"Root layout drives every slot from A to B",
						"Nested layout repeats the same slots from B to C",
					].map((note) => (
						<View key={note} style={styles.noteRow}>
							<View
								style={[
									styles.noteDot,
									{ backgroundColor: theme.actionButton },
								]}
							/>
							<Text style={[styles.noteText, { color: theme.textSecondary }]}>
								{note}
							</Text>
						</View>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
	content: {
		padding: 16,
		paddingBottom: 48,
		gap: 24,
	},
	copyBlock: {
		gap: 8,
		marginTop: 8,
	},
	kicker: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.8,
		textTransform: "uppercase",
	},
	title: {
		fontSize: 32,
		fontWeight: "700",
		letterSpacing: 0,
	},
	description: {
		fontSize: 16,
		lineHeight: 22,
	},
	featureRow: {
		minHeight: 116,
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		padding: 16,
		borderRadius: 24,
		borderCurve: "continuous",
	},
	thumbnail: {
		width: 84,
		height: 84,
		borderRadius: 20,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	rowText: {
		flex: 1,
		gap: 5,
	},
	rowTitleBound: {
		width: "100%",
	},
	rowTitle: {
		fontSize: 20,
		fontWeight: "700",
		letterSpacing: 0,
	},
	metaPill: {
		alignSelf: "flex-start",
		minHeight: 26,
		justifyContent: "center",
		paddingHorizontal: 10,
		borderRadius: 999,
	},
	metaPillText: {
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 0,
	},
	rowSubtitle: {
		fontSize: 14,
		lineHeight: 19,
	},
	chevron: {
		fontSize: 30,
		fontWeight: "300",
	},
	notes: {
		gap: 14,
		paddingHorizontal: 4,
	},
	noteRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	noteDot: {
		width: 7,
		height: 7,
		borderRadius: 999,
	},
	noteText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 19,
	},
});
