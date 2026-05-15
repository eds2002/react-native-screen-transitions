import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import {
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";

const PIN_THUMBS = [
	"https://picsum.photos/id/1002/600/600",
	"https://picsum.photos/id/1004/600/600",
	"https://picsum.photos/id/1009/600/600",
	"https://picsum.photos/id/1015/600/600",
	"https://picsum.photos/id/1020/600/600",
	"https://picsum.photos/id/1023/600/600",
	"https://picsum.photos/id/1027/600/600",
	"https://picsum.photos/id/1037/600/600",
	"https://picsum.photos/id/1048/600/600",
	"https://picsum.photos/id/1052/600/600",
	"https://picsum.photos/id/1063/600/600",
	"https://picsum.photos/id/1070/600/600",
];

const GRID_HORIZONTAL_PADDING = 24;
const PIN_COLUMN_GAP = 8;
const PIN_COLUMNS = 3;

function SharedImage({
	id,
	image,
	size,
}: {
	id: string;
	image: string;
	size: number;
}) {
	const theme = useTheme();
	const insets = useSafeAreaInsets();
	return (
		<Transition.Boundary.View
			id={id}
			style={[
				styles.sharedImage,
				{
					width: size,
					height: size,
					backgroundColor: theme.card,
					marginTop: insets.top + 16,
				},
			]}
		>
			<Image source={image} style={styles.imageContent} contentFit="cover" />
		</Transition.Boundary.View>
	);
}

export default function StyleIdBoundsDetail() {
	const { id, image, title, subtitle, description } = useLocalSearchParams<{
		id: string;
		image: string;
		title?: string;
		subtitle?: string;
		description?: string;
	}>();

	const { width } = useWindowDimensions();
	const imageSize = width * 0.8;
	const pinSize = Math.floor(
		(width - GRID_HORIZONTAL_PADDING * 2 - PIN_COLUMN_GAP * (PIN_COLUMNS - 1)) /
			PIN_COLUMNS,
	);
	const theme = useTheme();
	const resolvedTitle = title ?? "Atlas";
	const resolvedSubtitle = subtitle ?? "142 pins";
	const resolvedDescription =
		description ??
		"Far-away references kept for projects that haven't started yet — mostly cities, mostly mid-century, mostly accidental.";

	return (
		<Transition.ScrollView
			contentContainerStyle={styles.scrollContent}
			style={[styles.scroll, { backgroundColor: theme.bg }]}
		>
			<View style={styles.heroWrap}>
				<SharedImage id={id} image={image} size={imageSize} />
			</View>

			<Animated.View style={styles.section}>
				<Text style={[styles.title, { color: theme.text }]}>
					{resolvedTitle}
				</Text>
				<View style={styles.subtitleRow}>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
						{resolvedSubtitle}
					</Text>
					<Text style={[styles.subtitleDot, { color: theme.textTertiary }]}>
						·
					</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
						Since January 2024
					</Text>
				</View>

				<View style={styles.actions}>
					<Pressable
						style={({ pressed }) => [
							styles.actionPrimary,
							{
								backgroundColor: pressed
									? theme.actionButtonPressed
									: theme.actionButton,
							},
						]}
					>
						<Ionicons
							name="create-outline"
							size={20}
							color={theme.actionButtonText}
						/>
						<Text
							style={[styles.actionPrimaryText, { color: theme.actionButtonText }]}
						>
							Add pin
						</Text>
					</Pressable>
					<Pressable
						style={({ pressed }) => [
							styles.actionCircle,
							{
								backgroundColor: pressed
									? theme.secondaryButtonPressed
									: theme.secondaryButton,
							},
						]}
					>
						<Ionicons name="search" size={20} color={theme.text} />
					</Pressable>
					<Pressable
						style={({ pressed }) => [
							styles.actionCircle,
							{
								backgroundColor: pressed
									? theme.secondaryButtonPressed
									: theme.secondaryButton,
							},
						]}
					>
						<Ionicons name="share-outline" size={20} color={theme.text} />
					</Pressable>
				</View>

				<View
					style={[styles.divider, { backgroundColor: theme.separator }]}
				/>

				<View style={styles.block}>
					<Text style={[styles.kicker, { color: theme.textTertiary }]}>
						About
					</Text>
					<Text style={[styles.body, { color: theme.text }]}>
						{resolvedDescription}
					</Text>
				</View>

				<View style={styles.pinsHeader}>
					<Text style={[styles.kicker, { color: theme.textTertiary }]}>
						Pins
					</Text>
					<Text style={[styles.pinsCount, { color: theme.textSecondary }]}>
						12 of {resolvedSubtitle.replace(/[^0-9]/g, "") || "142"}
					</Text>
				</View>
				<View style={styles.pinsGrid}>
					{PIN_THUMBS.map((src) => (
						<View
							key={src}
							style={[
								styles.pinThumb,
								{
									width: pinSize,
									height: pinSize,
									backgroundColor: theme.card,
								},
							]}
						>
							<Image
								source={src}
								style={styles.imageContent}
								contentFit="cover"
							/>
						</View>
					))}
				</View>
			</Animated.View>
		</Transition.ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 100,
	},
	heroWrap: {
		alignItems: "center",
	},
	sharedImage: {
		borderRadius: 44,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	imageContent: {
		width: "100%",
		height: "100%",
	},
	section: {
		paddingHorizontal: GRID_HORIZONTAL_PADDING,
		paddingTop: 28,
		gap: 18,
	},
	title: {
		fontSize: 36,
		lineHeight: 42,
		fontWeight: "600",
		letterSpacing: -0.5,
		textAlign: "center",
	},
	subtitleRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 8,
		marginTop: -6,
	},
	subtitle: {
		fontSize: 15,
	},
	subtitleDot: {
		fontSize: 15,
	},
	actions: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		marginTop: 4,
	},
	actionPrimary: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 22,
		height: 52,
		borderRadius: 999,
	},
	actionPrimaryText: {
		fontSize: 16,
		fontWeight: "600",
	},
	actionCircle: {
		width: 52,
		height: 52,
		borderRadius: 26,
		alignItems: "center",
		justifyContent: "center",
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		width: "100%",
		marginTop: 10,
	},
	block: {
		gap: 8,
	},
	kicker: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	body: {
		fontSize: 15,
		lineHeight: 22,
	},
	pinsHeader: {
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
	},
	pinsCount: {
		fontSize: 13,
	},
	pinsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: PIN_COLUMN_GAP,
	},
	pinThumb: {
		borderRadius: 22,
		borderCurve: "continuous",
		overflow: "hidden",
	},
});
