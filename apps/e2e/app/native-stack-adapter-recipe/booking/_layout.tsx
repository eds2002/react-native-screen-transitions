import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { BookingStateProvider } from "@/components/native-stack-adapter/booking-state";
import { NativeStackAdapter } from "@/layouts/native-stack-adapter";

const destinationInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, focused, active }) => {
		"worklet";

		return {
			...bounds({ id: "booking-destination" }).navigation.zoom({
				borderRadius: 28,
				target: "bound",
			}),
			backdrop: focused
				? {
						backgroundColor: "black",
						opacity: interpolate(
							active.transitionProgress,
							[0, 1, 2],
							[0, 0.35, 0],
						),
					}
				: undefined,
		};
	};

export default function BookingLayout() {
	return (
		<BookingStateProvider>
			<NativeStackAdapter>
				<NativeStackAdapter.Screen
					name="index"
					options={{ title: "Explore" }}
				/>
				<NativeStackAdapter.Screen
					name="destination"
					options={{
						enableTransitions: true,
						gestureEnabled: true,
						gestureDirection: "horizontal",
						screenStyleInterpolator: destinationInterpolator,
						transitionSpec: Transition.Specs.Zoom,
					}}
				/>
				<NativeStackAdapter.Screen
					name="checkout"
					options={{ headerShown: false }}
				/>
			</NativeStackAdapter>
		</BookingStateProvider>
	);
}
