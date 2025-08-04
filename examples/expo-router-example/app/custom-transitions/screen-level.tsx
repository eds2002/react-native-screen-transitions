import { Text } from "react-native";
import Animated, {
	interpolate,
	interpolateColor,
	useAnimatedStyle,
} from "react-native-reanimated";
import { useScreenAnimation } from "react-native-screen-transitions";
import { Code } from "@/components/code";
import Page from "@/components/page";

export default function IosCardVerticalPreset() {
	const props = useScreenAnimation();

	const animatedStyle = useAnimatedStyle(() => {
		const { progress } = props.value;
		return {
			transform: [{ translateY: progress }],
			width: "100%",
			height: 50,
			borderRadius: interpolate(progress, [0, 1], [0, 25]),
			backgroundColor: interpolateColor(progress, [0, 1], ["red", "blue"]),
		};
	});
	return (
		<Page
			title="Screen Level"
			description="In some cases, you may want to create more customizable animations per
				screen, you can do this by using the following hook."
			backIcon={"chevron-left"}
			contentContainerStyle={{
				backgroundColor: "white",
				paddingBottom: 100,
			}}
			style={{
				flex: 1,
				backgroundColor: "white",
			}}
			scrollEnabled={true}
		>
			<Animated.View style={animatedStyle} />

			<Code showLineNumbers>{`const props = useScreenAnimation();`}</Code>

			<Text
				style={{
					fontSize: 14,
					color: "gray",
					fontWeight: "500",
				}}
			>
				Since this hook returns a derived object, it's important to use the
				props inside a worklet function.
			</Text>

			<Code showLineNumbers>{`const animatedStyle = useAnimatedStyle(() => {
  const { progress } = props.value;
  return {
    transform: [{ translateY: progress }],
    width: "100%",
    height: 50,
    borderRadius: interpolate(progress, [0, 1], [0, 25]),
    backgroundColor: interpolateColor(progress, [0, 1], ["red", "blue"]),
  };
});`}</Code>
		</Page>
	);
}
