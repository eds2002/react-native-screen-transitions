import { Text, View } from "react-native";
import { Code } from "@/components/code";
import Page from "@/components/page";

export default function IosCardHorizontalPreset() {
	return (
		<Page
			title="iOS Card Horizontal"
			description="Except this time it has gestures."
			backIcon={"chevron-left"}
			contentContainerStyle={{
				backgroundColor: "white",
				flex: 1,
			}}
			scrollEnabled={false}
		>
			<Code showLineNumbers>
				{`gestureEnabled: true,
gestureDirection: "horizontal"`}
			</Code>
			<View style={{ gap: 12 }}>
				<Text
					style={{
						fontSize: 14,
						color: "gray",
						fontWeight: "500",
					}}
				>
					You can set multiple directions and are not limited to just a single
					gesture.
				</Text>
				<Text
					style={{
						fontSize: 14,
						color: "gray",
						fontWeight: "500",
					}}
				>
					Gestures respond to swipes anywhere on the screen - no need to start
					at the edge.
				</Text>
				<Text
					style={{
						fontSize: 14,
						color: "gray",
						fontWeight: "500",
					}}
				>
					In the case you need the native stack's built-in gesture behavior, set{" "}
					<Code inline>nativeGestureDirection</Code> instead of{" "}
					<Code inline>gestureDirection</Code>.
				</Text>
			</View>
		</Page>
	);
}
