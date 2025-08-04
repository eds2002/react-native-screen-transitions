import { Text } from "react-native";
import { Code } from "@/components/code";
import Page from "@/components/page";

export default function IosCardHorizontalPreset() {
	return (
		<Page
			title="iOS Card Horizontal"
			description="Mimicks the default iOS card transition."
			backIcon={"chevron-left"}
			contentContainerStyle={{
				backgroundColor: "white",
				flex: 1,
			}}
			scrollEnabled={false}
		>
			<Code showLineNumbers>
				{`const x = interpolate(
  progress,
  [0, 1, 2],
  [width, 0, -width * 0.3]
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
