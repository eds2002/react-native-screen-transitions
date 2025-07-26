import { router } from "expo-router";
import { FlatList, View } from "react-native";
import Transition, { Bounds } from "react-native-screen-transitions";

export default function BoundsExampleA() {
	const data = [
		"shared-1",
		"shared-2",
		"shared-3",
		"shared-4",
		"shared-center",
		"shared-6",
		"shared-7",
		"shared-8",
		"shared-9",
	];

	const renderItem = ({ item }: { item: string }) => {
		return (
			<Transition.Pressable
				onPress={() => {
					router.push({
						pathname: "/bounds-example/[id]",
						params: { id: item },
					});
				}}
				style={{
					backgroundColor: "#d1d5db",
					height: 110,
					width: 110,
					margin: 5,
					borderRadius: 24,
					flex: 0,
				}}
				sharedBoundTag={item}
			/>
		);
	};

	return (
		<Transition.View
			style={{
				flex: 1,

				alignItems: "center",
				justifyContent: "center",
			}}
			sharedBoundTag="bounds-example"
		>
			<FlatList
				data={data}
				renderItem={renderItem}
				numColumns={3}
				keyExtractor={(item) => item}
				style={{
					flexGrow: 0,
				}}
				contentContainerStyle={{
					alignItems: "center",
					justifyContent: "center",
				}}
			/>
		</Transition.View>
	);
}
