import { router } from "expo-router";
import { Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import Page from "@/components/page";

export default function PageTransition() {
	return (
		<Page
			title="Active Bounds"
			description="Bounds were inspired by instagram page transitions. By tapping on a bound, it will be marked as active."
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
									sharedBoundTag={`active-bounds-${idx}`}
									style={{
										flex: 1,
										aspectRatio: 1,
										backgroundColor: `hsl(${idx * 40}, 90%, 60%)`,
										alignItems: "center",
										justifyContent: "center",
									}}
									onPress={() => {
										router.push(`/bounds/active-bounds/${idx}`);
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
