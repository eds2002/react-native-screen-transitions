import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import {
	TRANSITION_SCOPE_BOUNDARY_ID,
	TRANSITION_SCOPE_META_ID,
	TRANSITION_SCOPE_PHOTO,
	TRANSITION_SCOPE_TITLE_ID,
} from "../constants";

export default function TransitionScopeNestedIndex() {
	const theme = useTheme();
	const stackType = useResolvedStackType();

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
					Nested child stack
				</Text>
			</View>

			<View style={styles.content}>
				<Transition.Boundary.Trigger
					id={TRANSITION_SCOPE_BOUNDARY_ID}
					testID={`${TRANSITION_SCOPE_BOUNDARY_ID}-destination`}
					style={[styles.hero, { backgroundColor: theme.card }]}
					onPress={() => {
						router.push(
							buildStackPath(
								stackType,
								"bounds/transition-scope/nested/deep",
							) as never,
						);
					}}
				>
					<Image
						source={TRANSITION_SCOPE_PHOTO}
						style={styles.image}
						contentFit="cover"
					/>
				</Transition.Boundary.Trigger>

				<View style={styles.copy}>
					<Transition.Boundary.View
						id={TRANSITION_SCOPE_META_ID}
						style={[styles.metaPill, { backgroundColor: theme.actionButton }]}
					>
						<Text style={[styles.metaPillText, { color: theme.bg }]}>
							Open level 3
						</Text>
					</Transition.Boundary.View>
					<Text style={[styles.kicker, { color: theme.textSecondary }]}>
						Child route / level 2
					</Text>
					<Transition.Boundary.View
						id={TRANSITION_SCOPE_TITLE_ID}
						style={styles.titleBound}
					>
						<Text style={[styles.title, { color: theme.text }]}>
							This image becomes the next source
						</Text>
					</Transition.Boundary.View>
					<Text style={[styles.description, { color: theme.textSecondary }]}>
						The parent layout drives this first nested hop. Tap the image to
						push one navigator deeper and let this layout drive the next bound
						animation.
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
		paddingHorizontal: 20,
		paddingBottom: 40,
		gap: 24,
	},
	hero: {
		width: "100%",
		aspectRatio: 1,
		borderRadius: 34,
		borderCurve: "continuous",
		overflow: "hidden",
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
	image: {
		width: "100%",
		height: "100%",
	},
	copy: {
		gap: 8,
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
