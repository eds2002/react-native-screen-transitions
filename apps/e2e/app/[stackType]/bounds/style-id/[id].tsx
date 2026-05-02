import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";

function DragHandle() {
	const { top } = useSafeAreaInsets();
	const theme = useTheme();
	return (
		<View style={[styles.dragHandleContainer, { paddingTop: top }]}>
			<View style={[styles.dragHandle, { backgroundColor: theme.handle }]} />
		</View>
	);
}

function SharedImage({
	id,
	image,
	placeholder,
	size,
}: {
	id: string;
	image: string;
	placeholder: string;
	size: number;
}) {
	const theme = useTheme();
	return (
		<Transition.Boundary.View
			id={id}
			style={[
				styles.sharedImage,
				{ width: size, height: size, backgroundColor: theme.card },
			]}
			onTouchStart={router.back}
		>
			<Image
				source={image}
				placeholder={{ blurhash: placeholder }}
				style={styles.imageContent}
				contentFit="cover"
			/>
		</Transition.Boundary.View>
	);
}

export default function StyleIdBoundsDetail() {
	const { id, image, placeholder } = useLocalSearchParams<{
		id: string;
		image: string;
		placeholder: string;
	}>();

	const { width } = useWindowDimensions();
	const imageSize = width * 0.9;
	const theme = useTheme();

	return (
		<Transition.ScrollView
			contentContainerStyle={styles.scrollContent}
			style={[styles.scroll, { backgroundColor: theme.bg }]}
		>
			<DragHandle />
			<SharedImage
				id={id}
				image={image}
				placeholder={placeholder}
				size={imageSize}
			/>
			<View style={styles.section}>
				<Text style={[styles.title, { color: theme.text }]}>Image Detail</Text>
				<Text
					style={[styles.subtitle, { color: theme.textTertiary }]}
				>{`sharedBoundTag: "${id}"`}</Text>
				<Text style={[styles.description, { color: theme.textSecondary }]}>
					This example combines bounds animations with navigationMaskEnabled to
					animate the mask and content container independently.
				</Text>
				<View style={[styles.card, { backgroundColor: theme.card }]}>
					<Text style={[styles.cardTitle, { color: theme.text }]}>
						Custom Bounds Mask
					</Text>
					<Text style={[styles.cardDescription, { color: theme.textTertiary }]}>
						Two separate bounds() calls drive the navigation mask and content
						container independently.
					</Text>
				</View>
				<Text style={[styles.description, { color: theme.textSecondary }]}>
					Swipe down to dismiss and watch the reverse animation. The gesture
					values are passed through to the unfocused screen bound element,
					creating a connected drag feel.
				</Text>
			</View>
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
		borderRadius: 16,
		overflow: "hidden",
	},
	imageContent: {
		width: "100%",
		height: "100%",
	},
	section: {
		width: "100%",
		gap: 12,
	},
	title: {
		fontSize: 20,
		fontWeight: "600",
	},
	subtitle: {
		fontSize: 14,
		fontFamily: "monospace",
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
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
