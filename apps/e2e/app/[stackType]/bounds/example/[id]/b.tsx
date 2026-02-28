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
import { getNestedBoundsItemById } from "../constants";

export default function NestedBoundsScreenB() {
	const stackType = useResolvedStackType();
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const item = getNestedBoundsItemById(id);

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

				<View style={[styles.infoCard, { borderColor: `${item.accent}66` }]}>
					<Text style={[styles.kicker, { color: item.accent }]}>Day Plan</Text>
					{item.plan.map((entry, index) => (
						<View key={entry} style={styles.planRow}>
							<View style={[styles.stepBubble, { borderColor: `${item.accent}80` }]}>
								<Text style={styles.stepText}>{index + 1}</Text>
							</View>
							<Text style={styles.planText}>{entry}</Text>
						</View>
					))}
				</View>

				<View style={styles.tipCard}>
					<Text style={styles.tipTitle}>Why this screen exists</Text>
					<Text style={styles.tipBody}>
						Overview and Day Plan mimic a real app flow while keeping the
						transition easy to inspect.
					</Text>
				</View>

				<Pressable
					style={[styles.button, { backgroundColor: item.accent }]}
					onPress={() =>
						router.navigate(
							buildStackPath(stackType, `bounds/example/${item.id}/a`) as never,
						)
					}
				>
					<Text style={styles.buttonText}>Back to Overview</Text>
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
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.16)",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	infoCard: {
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		backgroundColor: "rgba(0,0,0,0.18)",
	},
	kicker: {
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		fontWeight: "700",
		color: "rgba(255,255,255,0.6)",
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
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
		backgroundColor: "rgba(0,0,0,0.16)",
	},
	stepText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#F4F8FF",
	},
	planText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 22,
		color: "rgba(255,255,255,0.84)",
	},
	tipCard: {
		padding: 14,
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.12)",
		backgroundColor: "rgba(255,255,255,0.03)",
	},
	tipTitle: {
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		fontWeight: "700",
		color: "rgba(255,255,255,0.64)",
	},
	tipBody: {
		marginTop: 6,
		fontSize: 14,
		lineHeight: 21,
		color: "rgba(255,255,255,0.78)",
	},
	button: {
		height: 52,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: "#0b111a",
		fontSize: 17,
		fontWeight: "700",
	},
});
