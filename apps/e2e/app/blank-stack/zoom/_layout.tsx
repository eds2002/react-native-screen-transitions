import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

const toZoomId = (route: { params?: object }) => {
	"worklet";
	const params = route.params as Record<string, unknown> | undefined;
	const rawId = params?.id;

	if (typeof rawId !== "string") {
		return null;
	}

	return rawId;
};

export default function ZoomLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="[id]"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted", "horizontal"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: ({ bounds, current, active, progress }) => {
						"worklet";

						const currentId = toZoomId(current.route);
						const activeId = toZoomId(active.route);
						const id = currentId ?? activeId;

						if (!id) {
							return {};
						}

						const navigationStyles = bounds.match({ id }).navigation.zoom({
							scaleMode: "uniform",
							maskBorderRadius: 28,
						});

						return {
							...navigationStyles,
							overlayStyle: {
								backgroundColor: "black",
								opacity: interpolate(progress, [0, 1, 2], [0, 0.5, 0]),
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.IOSZoomSpec,
						close: Transition.Specs.IOSZoomSpec,
					},
				}}
			/>
		</BlankStack>
	);
}
