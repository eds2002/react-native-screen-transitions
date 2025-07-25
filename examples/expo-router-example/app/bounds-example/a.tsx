import { View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function BoundsExampleA() {
	return (
		<Transition.View style={{ flex: 1, backgroundColor: "white" }}>
			<View style={{ flex: 1, flexDirection: "row" }}>
				<Transition.Bounds
					sharedBoundTag="a"
					style={{ flex: 1, backgroundColor: "red", margin: 4 }}
				/>
				<Transition.Bounds
					sharedBoundTag="b"
					style={{ flex: 1, backgroundColor: "blue", margin: 4 }}
				/>
				<Transition.Bounds
					sharedBoundTag="c"
					style={{ flex: 1, backgroundColor: "green", margin: 4 }}
				/>
			</View>
			<View style={{ flex: 1, flexDirection: "row" }}>
				<Transition.Bounds
					sharedBoundTag="d"
					style={{ flex: 1, backgroundColor: "yellow", margin: 4 }}
				/>
				<Transition.Bounds
					sharedBoundTag="e"
					style={{ flex: 1, backgroundColor: "purple", margin: 4 }}
				/>
				<Transition.Bounds
					sharedBoundTag="f"
					style={{ flex: 1, backgroundColor: "orange", margin: 4 }}
				/>
			</View>
			<View style={{ flex: 1, flexDirection: "row" }}>
				<Transition.Bounds
					sharedBoundTag="g"
					style={{ flex: 1, backgroundColor: "pink", margin: 4 }}
				/>
				<Transition.Bounds
					sharedBoundTag="h"
					style={{ flex: 1, backgroundColor: "cyan", margin: 4 }}
				/>
				<Transition.Bounds
					sharedBoundTag="i"
					style={{ flex: 1, backgroundColor: "brown", margin: 4 }}
				/>
			</View>
		</Transition.View>
	);
}
