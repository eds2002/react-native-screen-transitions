import { router } from "expo-router";
import { Button, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { useAnchorPoint } from "./_layout";

const options = [
	"topLeading",
	"top",
	"topTrailing",
	"leading",
	"center",
	"trailing",
	"bottomLeading",
	"bottom",
	"bottomTrailing",
] as const;

export default function AnchorPointScreen() {
	const { anchorPoint, setAnchorPoint } = useAnchorPoint();
	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Transition.Pressable
				sharedBoundTag="anchor-point"
				testID="anchor-point"
				style={{
					width: 200,
					height: 200,
					backgroundColor: "lightblue",
					alignItems: "center",
					justifyContent: "center",
				}}
				onPress={() => {
					router.push({
						pathname: "/e2e/bounds/anchor-point/[id]",
						params: { id: anchorPoint },
					});
				}}
			>
				<Text>{anchorPoint}</Text>
			</Transition.Pressable>
			<View style={{ flexDirection: "column", gap: 10 }}>
				{options.map((option) => (
					<Button
						key={option}
						title={option}
						onPress={() => setAnchorPoint(option)}
					/>
				))}
			</View>
		</View>
	);
}
