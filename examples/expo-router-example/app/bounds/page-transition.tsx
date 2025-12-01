import { Text } from "react-native";
import Transition from "react-native-screen-transitions";
import { Code } from "@/components/code";
import Page from "@/components/page";

export default function PageTransition() {
	return (
		<Transition.View sharedBoundTag="page-transition" style={{ flex: 1 }}>
			<Page
				title="Page Transition"
				description="A basic example of using bounds to create a screen transition. Swipe down to dismiss the screen."
				contentContainerStyle={{ paddingBottom: 100 }}
				style={{
					backgroundColor: "white",
				}}
			>
				<Code showLineNumbers>
					{`const transform = bounds()
 .toFullscreen()
 .absolute()
 .size()
 .build();

 return {
  contentStyle: {
   ...absoluteFillObject,
   ...transform
  },
 }
`}
				</Code>
				<Text
					style={{
						fontSize: 14,
						color: "gray",
						fontWeight: "500",
					}}
				>
					Note: Using .size() can be expensive as it animates the width / height
					of the screen. By defualt, .transform() is used to animate the scaleX
					/ scaleY. For this specific example, size() works perfectly fine.
				</Text>
			</Page>
		</Transition.View>
	);
}
