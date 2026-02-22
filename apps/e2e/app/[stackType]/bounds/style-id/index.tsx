import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useStyleIdBoundsStore } from "./_layout";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";

const IMAGES = [
	{
		id: "1",
		source: "https://picsum.photos/id/63/600/400",
		placeholder: "LwLSuiW;i_S2|xS2SLWp#TS2XRoL",
	},
	{
		id: "2",
		source: "https://picsum.photos/id/429/600/400",
		placeholder: "LRLNPtrV_MDOml.8.SDiM_kCRO%#",
	},
	{
		id: "3",
		source: "https://picsum.photos/id/326/600/400",
		placeholder: "LND+;YfQ~qofayj[fQj[fQf6ayfQ",
	},
	{
		id: "4",
		source: "https://picsum.photos/id/431/600/400",
		placeholder: "LNECwTfQ~qj[ofj[fQj[fQf6ayfQ",
	},
	{
		id: "5",
		source: "https://picsum.photos/id/493/600/400",
		placeholder: "LMFF%?fQ~qj[ofj[fQj[fQf6ayfQ",
	},
	{
		id: "6",
		source: "https://picsum.photos/id/766/600/400",
		placeholder: "LMHBXpfQ~qj[ofj[fQj[fQf6ayfQ",
	},
];

export default function StyleIdBoundsIndex() {
	const stackType = useResolvedStackType();
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Style ID Bounds"
				subtitle="Bounds with styleId masking"
			/>
			<View style={styles.content}>
				<View style={styles.grid}>
					{IMAGES.map((item) => {
						const tag = `shared-image-${item.id}`;
						return (
							<Transition.Pressable
								key={tag}
								testID={tag}
								sharedBoundTag={tag}
								style={styles.imageCell}
								onPress={() => {
									useStyleIdBoundsStore.setState({ boundTag: tag });
									router.push({
										pathname:
											buildStackPath(stackType, "bounds/style-id/[id]") as never,
										params: {
											id: tag,
											image: item.source,
											placeholder: item.placeholder,
										},
									});
								}}
							>
								<Image
									source={item.source}
									placeholder={{ blurhash: item.placeholder }}
									style={styles.image}
									contentFit="cover"
								/>
							</Transition.Pressable>
						);
					})}
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	content: {
		flex: 1,
		padding: 16,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		marginTop: 16,
	},
	imageCell: {
		width: "48%",
		aspectRatio: 1,
		borderRadius: 16,
		overflow: "hidden",
		backgroundColor: "#2a2a2a",
	},
	image: {
		width: "100%",
		height: "100%",
	},
});
