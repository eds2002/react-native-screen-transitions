import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";

function DragHandle() {
	const { top } = useSafeAreaInsets();
	return (
		<View style={[styles.dragHandleContainer, { paddingTop: top }]}>
			<View style={styles.dragHandle} />
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
	return (
		<Transition.View
			sharedBoundTag={id}
			style={[styles.sharedImage, { width: size, height: size }]}
		>
			<Image
				source={image}
				placeholder={{ blurhash: placeholder }}
				style={styles.imageContent}
				contentFit="cover"
			/>
		</Transition.View>
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

	return (
		<MaskedView
			style={styles.maskedView}
			maskElement={
				<Transition.View styleId="masked-view" style={styles.maskElement} />
			}
		>
			<Transition.View styleId="container-view">
				<Transition.ScrollView
					contentContainerStyle={styles.scrollContent}
					style={styles.scroll}
				>
					<DragHandle />
					<SharedImage
						id={id}
						image={image}
						placeholder={placeholder}
						size={imageSize}
					/>
					<View style={styles.section}>
						<Text style={styles.title}>Image Detail</Text>
						<Text style={styles.subtitle}>{`sharedBoundTag: "${id}"`}</Text>
						<Text style={styles.description}>
							This example combines bounds animations with styleId to animate
							multiple elements independently. The masked view clips the content
							during transition, while the container view scales the content to
							fit.
						</Text>
						<View style={styles.card}>
							<Text style={styles.cardTitle}>Bounds + StyleId</Text>
							<Text style={styles.cardDescription}>
								Two separate bounds() calls drive the mask and the content
								container independently.
							</Text>
						</View>
						<Text style={styles.description}>
							Swipe down to dismiss and watch the reverse animation. The gesture
							values are passed through to the unfocused screen's bound element,
							creating a connected drag feel.
						</Text>
					</View>
				</Transition.ScrollView>
			</Transition.View>
		</MaskedView>
	);
}

const styles = StyleSheet.create({
	maskedView: {
		flex: 1,
	},
	maskElement: {
		backgroundColor: "black",
	},
	scroll: {
		backgroundColor: "#121212",
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
		backgroundColor: "#555",
		width: 30,
		height: 5,
		borderRadius: 100,
	},
	sharedImage: {
		backgroundColor: "#2a2a2a",
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
		color: "#fff",
	},
	subtitle: {
		fontSize: 14,
		color: "#888",
		fontFamily: "monospace",
	},
	description: {
		fontSize: 14,
		color: "#aaa",
		lineHeight: 20,
	},
	card: {
		padding: 16,
		borderRadius: 16,
		borderColor: "#333",
		borderWidth: 1,
		backgroundColor: "#1e1e1e",
		gap: 8,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
	cardDescription: {
		fontSize: 13,
		color: "#888",
	},
});
