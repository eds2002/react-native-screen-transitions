import { FontAwesome6 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { getInstagramImage } from "./constants";

const PLACEHOLDER_COLOR = "#F1F5F9";
const FALLBACK_BOUND_TAG = "shared-instagram-fallback";

const getSingleParam = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default function SharedInstagramDetail() {
	const params = useLocalSearchParams<{
		id?: string | string[];
		sharedBoundId?: string | string[];
	}>();
	const id = getSingleParam(params.id);
	const sharedBoundId =
		getSingleParam(params.sharedBoundId) ?? FALLBACK_BOUND_TAG;
	const image = getInstagramImage(id);

	return (
		<Transition.MaskedView style={styles.mask}>
			<SafeAreaView style={styles.container} edges={["top"]}>
				<ScreenHeader light title="Posts" subtitle="trpfsu" />

				<View style={styles.authorRow}>
					<View style={styles.authorMeta}>
						<View style={styles.authorAvatar} />
						<Text style={styles.authorName}>trpfsu</Text>
					</View>
					<FontAwesome6 name="ellipsis" size={16} color="#111827" />
				</View>

				<Transition.View
					sharedBoundTag={sharedBoundId}
					style={styles.mediaFrame}
				>
					<Image
						source={image.url}
						style={styles.media}
						contentFit="cover"
					/>
				</Transition.View>

				<View style={styles.captionCard}>
					<Text style={styles.captionTitle}>Deprecated SharedIGImage</Text>
					<Text style={styles.captionBody}>
						This screen stays on the legacy preset path so you can compare its
						grid-to-post behavior against the newer bounds-based zoom demos.
					</Text>
				</View>
			</SafeAreaView>
		</Transition.MaskedView>
	);
}

const styles = StyleSheet.create({
	mask: {
		flex: 1,
		backgroundColor: "#FFF",
	},
	container: {
		flex: 1,
		backgroundColor: "#FFF",
	},
	authorRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	authorMeta: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	authorAvatar: {
		width: 32,
		height: 32,
		borderRadius: 999,
		backgroundColor: PLACEHOLDER_COLOR,
	},
	authorName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#000",
	},
	mediaFrame: {
		width: "100%",
		height: 490,
		backgroundColor: PLACEHOLDER_COLOR,
		overflow: "hidden",
	},
	media: {
		width: "100%",
		height: "100%",
	},
	captionCard: {
		margin: 16,
		borderRadius: 20,
		backgroundColor: "#F8FAFC",
		padding: 16,
		gap: 8,
	},
	captionTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#111827",
	},
	captionBody: {
		fontSize: 14,
		lineHeight: 22,
		color: "#64748B",
	},
});
