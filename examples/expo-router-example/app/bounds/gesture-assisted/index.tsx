import { router } from "expo-router";
import { Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import Page from "@/components/page";
import { useGestureBoundsStore } from "./_layout";

export default function PageTransition() {
	return (
		<Page
			title="Bounds + Gesture"
			description="You can use gestures alongisde bound animations to create more complex animations when gestures are involved. This method involves syncing gesture values together. Tap on any of the squares to get started."
			contentContainerStyle={{ paddingBottom: 100 }}
			style={{
				backgroundColor: "white",
			}}
			backIcon="chevron-left"
		>
			<View
				style={{
					marginTop: 24,
				}}
			>
				{Array.from({ length: 3 }).map((_, rowIdx) => (
					<View
						key={`row-${rowIdx.toString()}`}
						style={{
							flexDirection: "row",
							gap: 4,
							marginBottom: 4,
						}}
					>
						{Array.from({ length: 3 }).map((_, colIdx) => {
							const idx = rowIdx * 3 + colIdx;
							return (
								<Transition.Pressable
									key={`active-bounds-${idx.toString()}`}
									sharedBoundTag={`gesture-bounds-${idx}`}
									style={{
										flex: 1,
										aspectRatio: 1,
										backgroundColor: `hsl(${idx * 40}, 90%, 60%)`,
										alignItems: "center",
										justifyContent: "center",
									}}
									onPress={() => {
										useGestureBoundsStore.setState({
											boundTag: `gesture-bounds-${idx}`,
										});
										router.push(`/bounds/gesture-assisted/${idx}`);
									}}
								>
									<Text style={{ color: "white", fontWeight: "600" }}>
										{idx + 1}
									</Text>
								</Transition.Pressable>
							);
						})}
					</View>
				))}
			</View>
		</Page>
	);
}
