import { router } from "expo-router";

import Transition from "react-native-screen-transitions";

export default function IndexScreen() {
	return (
		<Transition.Pressable
			sharedBoundTag="test"
			onPress={router.back}
			style={{
				width: 100,
				height: 100,
				backgroundColor: "blue",
			}}
		/>
	);
}
