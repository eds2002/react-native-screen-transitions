import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ActionButton } from "../components/action-button";
import { MEDIA_BOUNDARY_ID, MEDIA_URL } from "../media";

export default function MediaScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.screen}>
			<View>
				<Text style={styles.eyebrow}>BOUNDS-DRIVEN MEDIA</Text>
				<Transition.Boundary
					id={MEDIA_BOUNDARY_ID}
					anchor="center"
					scaleMode="uniform"
				>
					<Transition.Boundary.Target style={styles.heroFrame}>
						<Image
							source={{ uri: MEDIA_URL }}
							style={styles.image}
							resizeMode="cover"
						/>
					</Transition.Boundary.Target>
				</Transition.Boundary>
				<Text style={styles.title}>One image, two measured bounds.</Text>
				<Text style={styles.description}>
					The source and destination share an ID. The route interpolator calls
					 bounds(id).navigation.zoom() to connect them.
				</Text>
			</View>

			<ActionButton label="Go back" onPress={router.back} secondary />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	description: {
		color: "#BDB3CB",
		fontSize: 16,
		lineHeight: 24,
		marginTop: 12,
	},
	eyebrow: {
		color: "#A78BFA",
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 1.1,
	},
	heroFrame: {
		aspectRatio: 4 / 3,
		borderRadius: 24,
		marginTop: 24,
		overflow: "hidden",
		width: "100%",
	},
	image: {
		height: "100%",
		width: "100%",
	},
	screen: {
		backgroundColor: "#17121F",
		flex: 1,
		justifyContent: "space-between",
		padding: 24,
	},
	title: {
		color: "#F4F1FF",
		fontSize: 34,
		fontWeight: "800",
		letterSpacing: -1,
		lineHeight: 38,
		marginTop: 24,
	},
});
