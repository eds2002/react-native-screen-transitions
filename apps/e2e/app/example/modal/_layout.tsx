import { View } from "react-native";
import { BlankStack } from "@/layouts/blank-stack";
import {
	IOS_SLIDE_BORDER_RADIUS,
	IOSSlide,
} from "@/lib/screen-transitions/ios-slide";
import { useTheme } from "@/theme";

export default function ModalLayout() {
	const theme = useTheme();
	return (
		<View
			style={{
				flex: 1,
				backgroundColor: theme.bg,
				borderRadius: IOS_SLIDE_BORDER_RADIUS,
				borderCurve: "continuous",
				overflow: "hidden",
			}}
		>
			<BlankStack>
				<BlankStack.Screen name="index" />
				<BlankStack.Screen name="b" options={{ ...IOSSlide() }} />
			</BlankStack>
		</View>
	);
}
