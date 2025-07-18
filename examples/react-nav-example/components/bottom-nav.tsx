import { StyleSheet, View } from "react-native";
import { SegmentedControl } from "./segmented-control";

export const BottomNav = ({
	activeSegment,
	setActiveSegment,
}: {
	activeSegment: number;
	setActiveSegment: (segment: number) => void;
}) => {
	return (
		<View
			style={[
				StyleSheet.absoluteFill,
				{
					flex: 1,
					justifyContent: "flex-end",
					padding: 48,
				},
			]}
		>
			<SegmentedControl
				segments={["Start", "Mocks"]}
				initialActiveIndex={activeSegment}
				style={{
					rootComponent: "normal",
					activeSegmentIndicator: {
						backgroundColor: "white",
					},
					text: {
						activeColor: "black",
						inactiveColor: "white",
					},
					container: {
						backgroundColor: "black",
						alignSelf: "center",
					},
				}}
				onActiveSegmentChanged={setActiveSegment}
			/>
		</View>
	);
};
