import { interpolate } from "react-native-reanimated";
import { BlankStack } from "@/layouts/blank-stack";

// EXTREMELY slow animation spec for testing touch gating behavior
const SlowSpec = {
	duration: 5000,
};

export default function TouchGatingLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="screen-b"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [height, 0], "clamp");
						const scale = interpolate(progress, [1.5, 2], [1, 0.95], "clamp");
						const overlayOpacity = interpolate(
							progress,
							[0, 1],
							[0, 0.5],
							"clamp",
						);

						return {
							contentStyle: {
								transform: [{ translateY: y }, { scale }],
							},
							overlayStyle: {
								backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
							},
						};
					},
					transitionSpec: {
						open: SlowSpec,
						close: SlowSpec,
					},
				}}
			/>
			<BlankStack.Screen
				name="screen-b-passthrough"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					backdropBehavior: "passthrough",
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [height * 0.5, 0], "clamp");
						const scale = interpolate(progress, [1.5, 2], [1, 0.95], "clamp");

						return {
							contentStyle: {
								transform: [{ translateY: y }, { scale }],
							},
						};
					},
					transitionSpec: {
						open: SlowSpec,
						close: SlowSpec,
					},
				}}
			/>
		</BlankStack>
	);
}
