import { BlankStack } from "@/layouts/blank-stack";

export default function StyleIdBoundsLayout() {
	const StackNavigator = BlankStack;

	return (
		<StackNavigator>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="[id]"
				options={{
					navigationMaskEnabled: true,
					gestureEnabled: true,
					gestureDirection: ["vertical", "horizontal", "vertical-inverted"],
					screenStyleInterpolator: ({ bounds, focused, active }) => {
						"worklet";
						const boundTag = (
							active?.route?.params as { id?: string } | undefined
						)?.id;

						if (!boundTag) {
							return {};
						}

						const revealStyles = bounds({
							id: boundTag,
						}).navigation.reveal();

						if (focused) {
							return {
								...revealStyles,
								backdrop: {
									style: {
										backgroundColor: "#00000025",
										opacity: active.progress,
									},
								},
							};
						}

						return revealStyles;
					},
					transitionSpec: {
						open: {
							stiffness: 750,
							damping: 1000,
							mass: 3,
							overshootClamping: false,
						},
						close: {
							stiffness: 500,
							damping: 1000,
							mass: 3,
							overshootClamping: false,
						},
					},
				}}
			/>
		</StackNavigator>
	);
}
