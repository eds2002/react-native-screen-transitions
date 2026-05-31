import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import {
	TRANSITION_SCOPE_BOUNDARY_ID,
	TRANSITION_SCOPE_META_ID,
	TRANSITION_SCOPE_PHOTO,
	TRANSITION_SCOPE_TITLE_ID,
} from "../../constants";

export default function TransitionScopeDeepIndex() {
	const theme = useTheme();
	const insets = useSafeAreaInsets();

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: theme.bg, paddingTop: insets.top },
			]}
		>
			<View style={styles.header}>
				<Pressable
					onPress={router.back}
					style={[styles.backButton, { backgroundColor: theme.card }]}
				>
					<Text style={[styles.backButtonText, { color: theme.text }]}>
						Back
					</Text>
				</Pressable>
				<Text style={[styles.headerLabel, { color: theme.textSecondary }]}>
					Grandchild stack
				</Text>
			</View>

			<View style={styles.content}>
				<Transition.Boundary.View
					id={TRANSITION_SCOPE_BOUNDARY_ID}
					testID={`${TRANSITION_SCOPE_BOUNDARY_ID}-deep-destination`}
					style={[styles.hero, { backgroundColor: theme.card }]}
				>
					<Image
						source={TRANSITION_SCOPE_PHOTO}
						style={styles.image}
						contentFit="cover"
					/>
				</Transition.Boundary.View>

				<View style={styles.copy}>
					<Transition.Boundary.View
						id={TRANSITION_SCOPE_META_ID}
						style={[styles.metaPill, { backgroundColor: theme.actionButton }]}
					>
						<Text style={[styles.metaPillText, { color: theme.bg }]}>
							Level 3 destination
						</Text>
					</Transition.Boundary.View>
					<Text style={[styles.kicker, { color: theme.textSecondary }]}>
						Grandchild route / level 3
					</Text>
					<Transition.Boundary.View
						id={TRANSITION_SCOPE_TITLE_ID}
						style={styles.titleBound}
					>
						<Text style={[styles.title, { color: theme.text }]}>
							The second layout owns this handoff
						</Text>
					</Transition.Boundary.View>
					<Text style={[styles.description, { color: theme.textSecondary }]}>
						This destination lives inside a third nested navigator. The
						intermediate layout computes the same photo, title, and badge bounds
						from this concrete route.
					</Text>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		height: 64,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
	},
	backButton: {
		height: 42,
		justifyContent: "center",
		paddingHorizontal: 18,
		borderRadius: 999,
	},
	backButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	headerLabel: {
		fontSize: 13,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	content: {
		flex: 1,
		paddingHorizontal: 18,
		paddingBottom: 40,
		gap: 24,
	},
	hero: {
		width: "100%",
		aspectRatio: 0.86,
		borderRadius: 44,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	copy: {
		gap: 8,
	},
	metaPill: {
		alignSelf: "flex-start",
		minHeight: 32,
		justifyContent: "center",
		paddingHorizontal: 12,
		borderRadius: 999,
	},
	metaPillText: {
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 0,
	},
	titleBound: {
		width: "100%",
	},
	kicker: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 0.8,
		textTransform: "uppercase",
	},
	title: {
		fontSize: 30,
		fontWeight: "700",
		letterSpacing: 0,
	},
	description: {
		fontSize: 16,
		lineHeight: 23,
	},
});
