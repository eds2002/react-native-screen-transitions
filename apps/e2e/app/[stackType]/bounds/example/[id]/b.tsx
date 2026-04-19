import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import { getNestedBoundsItemById } from "../constants";

export default function NestedBoundsScreenB() {
	const stackType = useResolvedStackType();
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const item = getNestedBoundsItemById(id);
	const theme = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: item.background }]}>
			<View style={{ paddingTop: insets.top }}>
				<ScreenHeader
					title={`${item.title} · Day Plan`}
					subtitle={`${item.location} itinerary`}
				/>
			</View>

			<Transition.ScrollView
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 28 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.hero}>
					<Image source={item.image} style={styles.image} contentFit="cover" />
				</View>

				<View style={[styles.infoCard, { backgroundColor: theme.surfaceElevated }]}>
					<Text style={[styles.kicker, { color: item.accent }]}>Day Plan</Text>
					{item.plan.map((entry, index) => (
						<View key={entry} style={styles.planRow}>
							<View style={[styles.stepBubble, { backgroundColor: theme.surface }]}>
								<Text style={[styles.stepText, { color: theme.text }]}>{index + 1}</Text>
							</View>
							<Text style={[styles.planText, { color: theme.textSecondary }]}>{entry}</Text>
						</View>
					))}
				</View>

				<View style={[styles.tipCard, { backgroundColor: theme.noteBox }]}>
					<Text style={[styles.tipTitle, { color: theme.noteText }]}>Why this screen exists</Text>
					<Text style={[styles.tipBody, { color: theme.textSecondary }]}>
						Overview and Day Plan mimic a real app flow while keeping the
						transition easy to inspect.
					</Text>
				</View>

				<Pressable
					style={({ pressed }) => [
						styles.button,
						{ backgroundColor: pressed ? theme.actionButtonPressed : item.accent },
					]}
					onPress={() =>
						router.navigate(
							buildStackPath(stackType, `bounds/example/${item.id}/a`) as never,
						)
					}
				>
					<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>Back to Overview</Text>
				</Pressable>
			</Transition.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 16,
		gap: 16,
	},
	hero: {
		width: "100%",
		aspectRatio: 1.02,
		borderRadius: 20,
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	infoCard: {
		padding: 16,
		borderRadius: 14,
	},
	kicker: {
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		fontWeight: "700",
	},
	planRow: {
		marginTop: 10,
		flexDirection: "row",
		alignItems: "flex-start",
	},
	stepBubble: {
		width: 24,
		height: 24,
		borderRadius: 99,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
	},
	stepText: {
		fontSize: 12,
		fontWeight: "700",
	},
	planText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 22,
	},
	tipCard: {
		padding: 14,
		borderRadius: 14,
	},
	tipTitle: {
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		fontWeight: "700",
	},
	tipBody: {
		marginTop: 6,
		fontSize: 14,
		lineHeight: 21,
	},
	button: {
		height: 52,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		fontSize: 17,
		fontWeight: "700",
	},
});
