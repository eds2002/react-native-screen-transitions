import "react-native-reanimated";

import { interpolate } from "react-native-reanimated";
import type { TransitionInterpolatedStyle } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

export default function MatchedScreenDebugLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="player"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({ bounds, focused }) => {
						"worklet";

						const scoped = bounds("video");
						const link = scoped.link();

						const content = scoped.math({
							method: "content",
							scaleMode: "match",
						});

						if (focused && content) {
							return {
								content: {
									style: {
										transform: [
											{ translateX: content?.translateX ?? 0 },
											{ translateY: content?.translateY ?? 0 },
											{ scale: content?.scale ?? 1 },
										],
										transformOrigin: content.transformOrigin,
									},
								},
							} as unknown as TransitionInterpolatedStyle;
						}

						const {
							rotate,
							rotateX,
							rotateY,
							scaleX,
							scaleY,
							transformOrigin,
							translateX,
							translateY,
						} = scoped.math({
							scaleMode: "match",
						});

						return {
							video: {
								style: {
									transform: [
										{ translateX },
										{ translateY },
										{ translateY: -100 },
										{ scaleX },
										{ scaleY },
										{ rotate: `${rotate}deg` },
										{ rotateX: `${rotateX}deg` },
										{ rotateY: `${rotateY}deg` },
									],
									transformOrigin,
								},
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</BlankStack>
	);
}
