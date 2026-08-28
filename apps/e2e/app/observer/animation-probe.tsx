import { StyleSheet, Text, View } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import { useScreenAnimation } from "react-native-screen-transitions";

type AnimationProbeProps = {
	color: string;
	label: string;
	testID: string;
};

export function AnimationProbe({ color, label, testID }: AnimationProbeProps) {
	const animation = useScreenAnimation(label);
	const animatedStyle = useAnimatedStyle(() => {
		const progress = animation.get()?.current.progress ?? 0;
		return {
			transform: [
				{
					translateX: interpolate(progress, [0, 1], [0, 114], "clamp"),
				},
			],
		};
	});

	return (
		<View style={styles.row} testID={testID}>
			<Text style={styles.label}>{label}</Text>
			<View style={styles.track}>
				<Animated.View
					testID={`${testID}-dot`}
					style={[styles.dot, { backgroundColor: color }, animatedStyle]}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	dot: {
		borderRadius: 11,
		height: 22,
		left: 0,
		position: "absolute",
		top: 2,
		width: 22,
	},
	label: {
		color: "#E2E8F0",
		fontFamily: "Menlo",
		fontSize: 11,
		fontWeight: "700",
		width: 188,
	},
	row: {
		alignItems: "center",
		flexDirection: "row",
		gap: 12,
	},
	track: {
		backgroundColor: "rgba(148,163,184,0.18)",
		borderRadius: 13,
		height: 26,
		overflow: "hidden",
		width: 136,
	},
});
