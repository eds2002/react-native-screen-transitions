import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { OverlayProps } from "../../../packages/react-native-screen-transitions/src/shared/types/core.types";

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
	screenAnimation,
}: OverlayProps) {
	const insets = useSafeAreaInsets();

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
			<View style={styles.tabBar}>
				<Pressable
					style={[styles.tab, !canGoBack && styles.tabDisabled]}
					onPress={() => canGoBack && nav.goBack()}
					disabled={!canGoBack}
				>
					<Text style={[styles.tabIcon, !canGoBack && styles.textDisabled]}>
						{"<"}
					</Text>
					<Text style={[styles.tabLabel, !canGoBack && styles.textDisabled]}>
						Back
					</Text>
				</Pressable>

				<View style={styles.routeInfo}>
					<Text style={styles.routeLabel}>
						{focusedRoute.name.split("/").pop()}
					</Text>
					<Text style={styles.routeIndex}>
						{focusedIndex + 1} / {routes.length}
					</Text>
				</View>

				<Pressable
					style={styles.tab}
					onPress={() => nav.popToTop?.()}
					disabled={!canGoBack}
				>
					<Text style={[styles.tabIcon, !canGoBack && styles.textDisabled]}>
						{"^"}
					</Text>
					<Text style={[styles.tabLabel, !canGoBack && styles.textDisabled]}>
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
		backgroundColor: "rgba(30, 30, 30, 0.95)",
		borderRadius: 16,
		paddingVertical: 8,
		paddingHorizontal: 8,
		alignItems: "center",
		justifyContent: "space-between",
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
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
		color: "#4a9eff",
		marginBottom: 2,
	},
	tabLabel: {
		fontSize: 11,
		color: "#888",
	},
	textDisabled: {
		color: "#555",
	},
	routeInfo: {
		alignItems: "center",
		flex: 1,
	},
	routeLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
	},
	routeIndex: {
		fontSize: 11,
		color: "#666",
		marginTop: 2,
	},
});
