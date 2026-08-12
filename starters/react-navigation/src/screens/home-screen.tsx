import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import type { BlankStackScreenProps } from "react-native-screen-transitions/react-navigation";
import { ActionButton } from "../components/action-button";
import { MEDIA_BOUNDARY_ID, MEDIA_URL } from "../media";
import type { RootStackParamList } from "../navigation/types";

type HomeScreenProps = BlankStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: HomeScreenProps) {
	return (
		<SafeAreaView style={styles.screen}>
			<View>
				<Text style={styles.eyebrow}>V4 ALPHA · REACT NAVIGATION · SDK 56</Text>
				<Text style={styles.title}>A small, real starting point.</Text>
				<Text style={styles.description}>
					This app uses upstream React Navigation directly and keeps the
					navigator setup in one obvious place.
				</Text>
			</View>

			<View style={styles.card}>
				<Text style={styles.cardTitle}>Included</Text>
				<Text style={styles.cardCopy}>Gesture-driven detail dismissal</Text>
				<Text style={styles.cardCopy}>Two-detent snap sheet</Text>
				<Transition.Boundary
					id={MEDIA_BOUNDARY_ID}
					anchor="center"
					scaleMode="uniform"
					style={styles.mediaCard}
					onPress={() => navigation.navigate("Media")}
				>
					<Transition.Boundary.Target style={styles.thumbnailFrame}>
						<Image
							source={{ uri: MEDIA_URL }}
							style={styles.mediaImage}
							resizeMode="cover"
						/>
					</Transition.Boundary.Target>
					<View style={styles.mediaCopy}>
						<Text style={styles.mediaTitle}>Open media zoom</Text>
						<Text style={styles.mediaDescription}>
							Remote image · paired bounds
						</Text>
					</View>
				</Transition.Boundary>
			</View>

			<View style={styles.actions}>
				<ActionButton
					label="Open detail"
					onPress={() => navigation.navigate("Detail")}
				/>
				<ActionButton
					label="Open snap sheet"
					onPress={() => navigation.navigate("Sheet")}
					secondary
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	actions: {
		gap: 12,
	},
	card: {
		backgroundColor: "#211C2A",
		borderColor: "#342D40",
		borderRadius: 24,
		borderWidth: 1,
		gap: 9,
		padding: 22,
	},
	cardCopy: {
		color: "#BDB3CB",
		fontSize: 15,
	},
	cardTitle: {
		color: "#F4F1FF",
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 4,
	},
	description: {
		color: "#BDB3CB",
		fontSize: 17,
		lineHeight: 25,
		marginTop: 16,
	},
	eyebrow: {
		color: "#A78BFA",
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 1.1,
	},
	mediaCard: {
		alignItems: "center",
		backgroundColor: "#30283D",
		borderRadius: 18,
		flexDirection: "row",
		gap: 13,
		marginTop: 8,
		padding: 10,
	},
	mediaCopy: {
		flex: 1,
	},
	mediaDescription: {
		color: "#A99CB8",
		fontSize: 12,
		marginTop: 3,
	},
	mediaImage: {
		height: "100%",
		width: "100%",
	},
	mediaTitle: {
		color: "#F4F1FF",
		fontSize: 15,
		fontWeight: "700",
	},
	screen: {
		backgroundColor: "#17121F",
		flex: 1,
		justifyContent: "space-between",
		padding: 24,
	},
	thumbnailFrame: {
		aspectRatio: 4 / 3,
		borderRadius: 12,
		overflow: "hidden",
		width: 96,
	},
	title: {
		color: "#F4F1FF",
		fontSize: 42,
		fontWeight: "800",
		letterSpacing: -1.5,
		lineHeight: 46,
		marginTop: 12,
	},
});
