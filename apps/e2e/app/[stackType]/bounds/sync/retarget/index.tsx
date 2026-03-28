import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

export default function SyncRetargetIndex() {
	const stackType = useResolvedStackType();
	const insets = useSafeAreaInsets();
	const theme = useTheme();

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: theme.bg,
					paddingTop: insets.top,
				},
			]}
		>
			<ScreenHeader
				title={"Retarget"}
				subtitle="Dedicated sync retarget source"
			/>

			<View style={[styles.arena]}>
				<Transition.Boundary.Trigger
					id="retarget"
					anchor="center"
					scaleMode="match"
					style={[
						styles.activeBox,
						{
							width: 100,
							height: 100,
							backgroundColor: theme.actionButton,
							margin: 24,
						},
					]}
					onPress={() => {
						router.push(
							buildStackPath(
								stackType,
								`bounds/sync/retarget/retarget`,
							) as never,
						);
					}}
				>
					<Text style={[styles.activeLabel, { color: theme.actionButtonText }]}>
						SRC
					</Text>
				</Transition.Boundary.Trigger>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	noteWrap: {
		paddingHorizontal: 24,
		paddingBottom: 12,
		alignItems: "center",
	},
	noteTitle: {
		fontSize: 20,
		fontWeight: "700",
		textAlign: "center",
	},
	noteBody: {
		marginTop: 8,
		fontSize: 15,
		lineHeight: 23,
		textAlign: "center",
		maxWidth: 360,
	},
	arena: {
		flex: 1,
		position: "relative",
	},
	activeBox: {
		position: "absolute",
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	activeLabel: {
		fontWeight: "700",
		fontSize: 14,
	},
});
