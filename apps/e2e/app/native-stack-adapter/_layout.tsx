import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { NativeStackAdapter } from "@/layouts/native-stack-adapter";
import { ADAPTER_AVATAR_BOUNDARY_ID } from "./constants";

const avatarInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] = ({
	bounds,
	progress,
}) => {
	"worklet";

	return {
		...bounds({
			id: ADAPTER_AVATAR_BOUNDARY_ID,
		}).navigation.zoom({
			target: "bound",
			borderRadius: 40,
		}),
		backdrop: {
			backgroundColor: "black",
			opacity: interpolate(progress, [0, 1, 2], [0, 0.45, 0]),
		},
	};
};

export default function NativeStackAdapterLayout() {
	return (
		<NativeStackAdapter>
			<NativeStackAdapter.Screen name="index" />
			<NativeStackAdapter.Screen
				name="avatar"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "bidirectional",
					gestureProgressMode: "freeform",
					screenStyleInterpolator: avatarInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
		</NativeStackAdapter>
	);
}
