import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	type OverlayProps,
	useScreenAnimation,
} from "react-native-screen-transitions";
import { useTheme } from "@/theme";

/**
 * A demo tab bar overlay that animates based on screen transitions.
 * Shows the current route name and provides navigation controls.
 *
 * Uses the generic OverlayProps type so it works with both blank-stack and native-stack.
 */
export function TabBarOverlay({
	focusedRoute,
	focusedIndex,
	routes,
	navigation,
}: OverlayProps) {
	const insets = useSafeAreaInsets();
	const screenAnimation = useScreenAnimation();
	const theme = useTheme();

	const containerStyle = useAnimatedStyle(() => {
		const { stackProgress } = screenAnimation.value;

		// Fade out when stack progress increases (more screens on top)
		// stackProgress = 1 means just this screen, > 1 means screens above
		const opacity = interpolate(stackProgress, [1, 2], [1, 0.3], "clamp");

		return {
			opacity,
		};
	});

	const canGoBack = focusedIndex > 0;

	// Cast navigation to any since we use the generic OverlayProps
	// The actual navigation type is determined at runtime by the stack
	const nav = navigation as { goBack: () => void; popToTop?: () => void };

	return (
		<Animated.View
			style={[
				styles.container,
				{ paddingBottom: insets.bottom + 8 },
				containerStyle,
			]}
		>
			<View style={[styles.tabBar, { backgroundColor: theme.tabBarBg }]}>
				<Pressable
					style={[styles.tab, !canGoBack && styles.tabDisabled]}
					onPress={() => canGoBack && nav.goBack()}
					disabled={!canGoBack}
				>
					<Text
						style={[
							styles.tabIcon,
							{ color: theme.tabBarActive },
							!canGoBack && { color: theme.textTertiary },
						]}
					>
						{"<"}
					</Text>
					<Text
						style={[
							styles.tabLabel,
							{ color: theme.textSecondary },
							!canGoBack && { color: theme.textTertiary },
						]}
					>
						Back
					</Text>
				</Pressable>

				<View style={styles.routeInfo}>
					<Text style={[styles.routeLabel, { color: theme.text }]}>
						{focusedRoute.name.split("/").pop()}
					</Text>
					<Text style={[styles.routeIndex, { color: theme.textTertiary }]}>
						{focusedIndex + 1} / {routes.length}
					</Text>
				</View>

				<Pressable
					style={styles.tab}
					onPress={() => nav.popToTop?.()}
					disabled={!canGoBack}
				>
					<Text
						style={[
							styles.tabIcon,
							{ color: theme.tabBarActive },
							!canGoBack && { color: theme.textTertiary },
						]}
					>
						{"^"}
					</Text>
					<Text
						style={[
							styles.tabLabel,
							{ color: theme.textSecondary },
							!canGoBack && { color: theme.textTertiary },
						]}
					>
						Home
					</Text>
				</Pressable>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		paddingHorizontal: 16,
	},
	tabBar: {
		flexDirection: "row",
		borderRadius: 999,
		paddingVertical: 8,
		paddingHorizontal: 8,
		alignItems: "center",
		justifyContent: "space-between",
	},
	tab: {
		alignItems: "center",
		paddingVertical: 8,
		paddingHorizontal: 16,
		minWidth: 70,
	},
	tabDisabled: {
		opacity: 0.4,
	},
	tabIcon: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 2,
	},
	tabLabel: {
		fontSize: 11,
	},
	routeInfo: {
		alignItems: "center",
		flex: 1,
	},
	routeLabel: {
		fontSize: 14,
		fontWeight: "600",
	},
	routeIndex: {
		fontSize: 11,
		marginTop: 2,
	},
});
