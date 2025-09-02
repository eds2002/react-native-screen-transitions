import { router } from "expo-router";
import Transition from "react-native-screen-transitions";

export default function CustomBoundsScreen() {
	return (
		<Transition.Pressable
			sharedBoundTag="custom-bounds"
			style={{ width: 100, height: 100, backgroundColor: "red", opacity: 0.5 }}
			onPress={router.back}
		/>
	);
}
