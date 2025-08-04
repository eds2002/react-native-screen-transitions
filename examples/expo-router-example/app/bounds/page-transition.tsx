import { Text } from "react-native";
import { Code } from "@/components/code";
import Page from "@/components/page";

export default function PageTransition() {
	return (
		<Page
			title="Page Transition"
			description="A basic example of using bounds to create a screen transition. Swipe down to dismiss the screen."
			contentContainerStyle={{ paddingBottom: 100 }}
			style={{
				backgroundColor: "white",
			}}
		>
			<Text
				style={{
					fontSize: 14,
					color: "gray",
					fontWeight: "500",
				}}
			>
				This example focuses solely on the focused screen. First, we gather the
				bounds of the previous screen.
			</Text>
			<Code showLineNumbers>
				{`if (focused) {
  const prev = bounds.get("previous", "boundId");
}`}
			</Code>
			<Text
				style={{
					fontSize: 14,
					color: "gray",
					fontWeight: "500",
				}}
			>
				With the previous screen's bounds in hand, we can animate smoothly from
				those dimensions to the full size of the current screen.
			</Text>
			<Code showLineNumbers>
				{`const animatedHeight = interpolate(
  progress,
  [0, 1],
  [prev.height, height],
  "clamp",
);
const animatedWidth = interpolate(
  progress,
  [0, 1],
  [prev.width, width],
  "clamp",
);

const translateX = interpolate(
  progress,
  [0, 1],
  [prev.pageX, 0],
  "clamp",
);
const translateY = interpolate(
  progress,
  [0, 1],
  [prev.pageY, 0],
  "clamp",
);`}
			</Code>
			<Text
				style={{
					fontSize: 14,
					color: "gray",
					fontWeight: "500",
				}}
			>
				You should NEVER animate the width and height of a screen as it may
				cause performance issues. This is just a basic example.
			</Text>
		</Page>
	);
}
