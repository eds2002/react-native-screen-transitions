import { Text } from "react-native";
import { Code } from "@/components/code";
import Page from "@/components/page";

export default function IosCardVerticalPreset() {
	return (
		<Page
			title="iOS Card Vertical"
			description="Mimicks the default iOS card transition, except it's vertical."
			backIcon={"chevron-down"}
			contentContainerStyle={{
				backgroundColor: "white",
				flex: 1,
			}}
			scrollEnabled={false}
		>
			<Code showLineNumbers>
				{`const y = interpolate(
  progress,
  [0, 1, 2],
  [height, 0, -height * 0.3]
);`}
			</Code>
			<Text
				style={{
					fontSize: 14,
					color: "gray",
					fontWeight: "500",
				}}
			>
				The progress value ranges from 0 - 2, where 1 is focused and 2 is
				unfocused.
			</Text>
		</Page>
	);
}
