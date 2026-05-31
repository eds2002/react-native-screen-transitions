import { useCallback, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { useScreenAnimation } from "react-native-screen-transitions";
import { scheduleOnRN } from "react-native-worklets";

export function SnapIndexProbe({ testID }: { testID: string }) {
	const animation = useScreenAnimation();
	const [snapIndex, setSnapIndex] = useState(-1);

	const updateSnapIndex = useCallback((value: number) => {
		setSnapIndex(value);
	}, []);

	useAnimatedReaction(
		() => Math.max(0, animation.value.current.snapIndex),
		(current, previous) => {
			if (current !== previous) {
				scheduleOnRN(updateSnapIndex, current);
			}
		},
		[updateSnapIndex],
	);

	return (
		<Text testID={testID} style={styles.probe}>
			snap-index:{snapIndex}
		</Text>
	);
}

export function ContentLayoutProbe({ testID }: { testID: string }) {
	const animation = useScreenAnimation();
	const [bucket, setBucket] = useState("unmeasured");

	const updateBucket = useCallback((value: string) => {
		setBucket(value);
	}, []);

	useAnimatedReaction(
		() => {
			const height = animation.value.current.layouts.content?.height ?? 0;

			if (height >= 300) {
				return "expanded";
			}

			if (height > 0) {
				return "compact";
			}

			return "unmeasured";
		},
		(current, previous) => {
			if (current !== previous) {
				scheduleOnRN(updateBucket, current);
			}
		},
		[updateBucket],
	);

	return (
		<Text testID={testID} style={styles.probe}>
			content-layout:{bucket}
		</Text>
	);
}

const styles = StyleSheet.create({
	probe: {
		alignSelf: "center",
		color: "rgba(255,255,255,0.62)",
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 0,
		marginBottom: 8,
		textTransform: "uppercase",
	},
});
