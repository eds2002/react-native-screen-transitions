import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Dimensions, Pressable, View } from "react-native";
import Transition from "react-native-screen-transitions";

const blurhash =
	"|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export default function InstagramExample() {
	const { id, image } = useLocalSearchParams<{ id: string; image: string }>();

	const { width, height } = Dimensions.get("window");

	const mockReels = [
		image,
		`https://picsum.photos/id/25/400/400`,
		`https://picsum.photos/id/26/400/400`,
		`https://picsum.photos/id/27/400/400`,
		`https://picsum.photos/id/28/400/400`,
		`https://picsum.photos/id/29/400/400`,
		`https://picsum.photos/id/30/400/400`,
	];

	return (
		<MaskedView
			maskElement={<Transition.View styleId="ig-mask" pointerEvents="none" />}
			pointerEvents="box-none"
		>
			<Transition.FlatList
				data={mockReels}
				keyExtractor={(item, index) => `${item}-${index}`}
				renderItem={({ item, index }) => (
					<View style={{ width: width, height: height }}>
						{index === 0 ? (
							<Transition.Pressable
								onPress={router.back}
								sharedBoundTag={id}
								style={{ width: width, height: height }}
							>
								<Image
									source={{ uri: item as string }}
									style={{
										width: width,
										height: height,
										resizeMode: "contain",
									}}
									placeholder={{ blurhash }}
								/>
							</Transition.Pressable>
						) : (
							<Pressable
								onPress={router.back}
								style={{ width: width, height: height }}
							>
								<Image
									source={{ uri: item as string }}
									style={{
										width: width,
										height: height,
										resizeMode: "contain",
									}}
									placeholder={{ blurhash }}
								/>
							</Pressable>
						)}
					</View>
				)}
				snapToInterval={height}
				disableIntervalMomentum
				decelerationRate="fast"
				showsVerticalScrollIndicator={false}
				snapToAlignment="start"
				contentContainerStyle={{
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "black",
					borderRadius: 36,
				}}
			/>
		</MaskedView>
	);
}
