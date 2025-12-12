import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import Transition from "react-native-screen-transitions";
import { Code } from "@/components/code";
import Page from "@/components/page";

export default function GestureBoundsScreen() {
	const { id } = useLocalSearchParams();

	return (
		<Transition.View
			sharedBoundTag={`gesture-bounds-${id.toString()}`}
			style={{ flex: 1 }}
		>
			<Page
				title="Bounds + Gesture"
				description="Swipe down to trigger the dismissal. Drag around and see the previous unfocused bound move alongside with the current bound."
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
					{`const animatingBound = bounds(activeBoundId)
	.toFullscreen()
	.gestures({
		x: !next ? current.gesture.x : next.gesture.x,
		y: !next ? current.gesture.y : next.gesture.y,
	})
	.transform()
	.build();
					`}
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
					This snippet animates both bounds (unfocused & focused). While this is
					an okay approach, it generally looks lazy and ugly. I would recommend
					separating your bounds from focused to unfocused for more
					customizability.
				</Text>
			</Page>
		</Transition.View>
	);
}
