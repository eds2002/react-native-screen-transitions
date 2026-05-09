import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
	Button,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";

const DETAIL_ROWS = [
	"overview",
	"conditions",
	"timeline",
	"notes",
	"location",
	"metadata",
] as const;

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
					marginTop: insets.top + 24,
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
	const theme = useTheme();
	const resolvedTitle = title ?? "Atlas Frame";
	const resolvedSubtitle = subtitle ?? "Alpine light study";
	const resolvedDescription =
		description ??
		"Golden light settles across a quiet alpine lake, giving the transition a cleaner landscape subject with strong color and depth.";

	return (
		<Transition.ScrollView
			contentContainerStyle={styles.scrollContent}
			style={[styles.scroll, { backgroundColor: theme.bg }]}
		>
			<SharedImage id={id} image={image} size={imageSize} />
			<Animated.View style={styles.section}>
				<View
					style={{
						width: "100%",
						gap: 6,
					}}
				>
					<Text style={[styles.kicker, { color: theme.textSecondary }]}>
						{resolvedSubtitle}
					</Text>
					<Text style={[styles.title, { color: theme.text }]}>
						{resolvedTitle}
					</Text>
					<Text style={[styles.description, { color: theme.textSecondary }]}>
						{resolvedDescription}
					</Text>
				</View>
				<View
					style={{
						width: "100%",
						height: StyleSheet.hairlineWidth,
						backgroundColor: "lightgrey",
						marginVertical: 12,
					}}
				/>
				{DETAIL_ROWS.map((rowId) => (
					<View
						key={rowId}
						style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
					>
						<View
							style={{
								width: 50,
								height: 50,
								backgroundColor: "lightgrey",
								borderRadius: 20,
								borderCurve: "continuous",
							}}
						/>
						<View style={{ flex: 1, flexDirection: "column", gap: 4 }}>
							<Text
								style={[
									styles.title,
									{ color: theme.text, fontSize: 16, textAlign: "left" },
								]}
							>
								Title
							</Text>
							<Text
								style={[
									styles.description,
									{ color: theme.textSecondary, textAlign: "left" },
								]}
							>
								A short description goes here.
							</Text>
						</View>
					</View>
				))}

				<View
					style={{
						width: "100%",
						height: StyleSheet.hairlineWidth,
						backgroundColor: "lightgrey",
						marginVertical: 12,
						gap: 6,
					}}
				/>
				<View
					style={{
						width: "100%",
					}}
				>
					<Text
						style={[styles.title, { color: theme.text, textAlign: "left" }]}
					>
						What you&apos;ll do
					</Text>
					<Text
						style={[
							styles.description,
							{ color: theme.textSecondary, textAlign: "left" },
						]}
					>
						This example uses navigation.reveal to keep the destination screen
						visible while the source boundary expands into place.
					</Text>
				</View>
				<Button title="Go back" onPress={router.back} />
			</Animated.View>
		</Transition.ScrollView>
	);
}

const styles = StyleSheet.create({
	scroll: {
		flex: 1,
	},
	scrollContent: {
		alignItems: "center",
		gap: 16,
		paddingHorizontal: 24,
		paddingBottom: 100,
	},
	dragHandleContainer: {
		width: "100%",
		alignItems: "center",
		paddingVertical: 12,
	},
	dragHandle: {
		width: 30,
		height: 5,
		borderRadius: 100,
	},
	sharedImage: {
		borderRadius: 32,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	imageContent: {
		width: "100%",
		height: "100%",
	},
	section: {
		width: "100%",
		gap: 12,
		// padding: 12,
	},
	title: {
		fontSize: 24,
		fontWeight: "600",
		textAlign: "center",
	},
	kicker: {
		fontSize: 13,
		fontWeight: "700",
		textAlign: "center",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: "monospace",
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
		opacity: 0.7,
	},
	card: {
		padding: 16,
		borderRadius: 14,
		gap: 8,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "600",
	},
	cardDescription: {
		fontSize: 13,
	},
});
