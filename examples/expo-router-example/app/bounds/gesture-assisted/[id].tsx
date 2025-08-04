import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import Transition from "react-native-screen-transitions";
import { Code } from "@/components/code";
import Page from "@/components/page";

export default function GestureBoundsScreen() {
	const { id } = useLocalSearchParams();
	return (
		<Transition.View styleId={`gesture-bounds-${id.toString()}`}>
			<Page
				title="Gesture-Assisted, Bounds-Aware"
				description="Swipe down to dismiss. The gesture drives the transition progress; bounds maintain visual continuity and a smooth return to rest."
				contentContainerStyle={{
					alignItems: "center",
					justifyContent: "center",
					flex: 0,
					paddingBottom: 150,
				}}
				style={{
					backgroundColor: "white",
				}}
				scrollEnabled={true}
				backIcon="chevron-down"
			>
				<Code showLineNumbers>
					{`if (focused) {
  const boundStyles =
    bounds()
     // Start at prev bounds
     .start("previous")
     // End at full screen bounds
     .end()
     .x(current.gesture.x)
     .y(current.gesture.y)
     .isEntering()
     .build();
}`}
				</Code>
				<Text
					style={{
						fontSize: 14,
						color: "gray",
						fontWeight: "500",
						marginTop: 16,
						marginBottom: 8,
					}}
				>
					This pattern isn't about constraining a drag inside bounds. Instead,
					the gesture smoothly “eases” the transition while bounds keep the
					visual link between screens and ensure a natural return to rest.
				</Text>
				<Code showLineNumbers>
					{`//For focused screens
     .isEntering()
    //  For unfocused screens
     .isExiting()
}`}
				</Code>
				<Text
					style={{
						fontSize: 14,
						color: "gray",
						fontWeight: "500",
						marginTop: 16,
						marginBottom: 8,
					}}
				>
					Clarify the interpolation direction for this animation:
					{"\n"}
					{"  "}• For isEntering(), the interpolator uses [0, 1].
					{"\n"}
					{"  "}• For isExiting(), the interpolator uses [1, 2].
					{"\n"}
					Note: This behavior may change in the future.
				</Text>
			</Page>
		</Transition.View>
	);
}
