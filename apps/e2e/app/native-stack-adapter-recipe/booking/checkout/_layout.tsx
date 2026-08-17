import Transition from "react-native-screen-transitions";
import { NativeStackAdapter } from "@/layouts/native-stack-adapter";

export default function CheckoutLayout() {
	return (
		<NativeStackAdapter>
			<NativeStackAdapter.Screen
				name="index"
				options={{ title: "Your trip" }}
			/>
			<NativeStackAdapter.Screen
				name="preferences"
				options={{ title: "Preferences" }}
			/>
			<NativeStackAdapter.Screen
				name="review"
				options={{
					...Transition.Presets.SlideFromBottom(),
				}}
			/>
		</NativeStackAdapter>
	);
}
