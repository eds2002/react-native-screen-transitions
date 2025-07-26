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

	const renderItem = ({ item, index }: { item: string; index: number }) => {
		const getCornerRadii = (index: number) => {
			// 3x3 grid positions:
			// 0 1 2
			// 3 4 5
			// 6 7 8

			const row = Math.floor(index / 3);
			const col = index % 3;

			// Default radius for edges, smaller for inner edges
			const outerRadius = 36;
			const innerRadius = 12;

			let topLeft = innerRadius;
			let topRight = innerRadius;
			let bottomLeft = innerRadius;
			let bottomRight = innerRadius;

			// Top row
			if (row === 0) {
				topLeft = outerRadius;
				topRight = outerRadius;
			}

			// Bottom row
			if (row === 2) {
				bottomLeft = outerRadius;
				bottomRight = outerRadius;
			}

			// Left column
			if (col === 0) {
				topLeft = outerRadius;
				bottomLeft = outerRadius;
			}

			// Right column
			if (col === 2) {
				topRight = outerRadius;
				bottomRight = outerRadius;
			}

			return {
				borderTopLeftRadius: 24,
				borderTopRightRadius: 24,
				borderBottomLeftRadius: 24,
				borderBottomRightRadius: 24,
			};
		};

		return (
			<Bounds
				sharedBoundTag={item}
				onPress={() => {
					router.push({
						pathname: "/bounds-example/[id]",
						params: { id: item },
					});
				}}
			>
				<View
					style={{
						backgroundColor: "#d1d5db",
						height: 110,
						width: 110,
						margin: 5,
						borderRadius: 24,
					}}
				></View>
			</Bounds>
		);
	};

	return (
		<Transition.View
			style={{
				flex: 1,

				alignItems: "center",
				justifyContent: "center",
			}}
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
