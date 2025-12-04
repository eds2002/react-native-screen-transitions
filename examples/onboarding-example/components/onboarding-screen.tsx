import type { FlexAlignType, ViewStyle } from "react-native";
import { View } from "react-native";
import Transition from "react-native-screen-transitions";
import { useFocusInput } from "@/hooks/use-focus-input";
import { Container } from "./container";
import { Input } from "./input";
import { Typography } from "./typography";

interface OnboardingScreenProps {
	heading: string;
	subtitle: string;
	placeholder: string;
	sharedElementAlign?: FlexAlignType;
	color?: string;
}

export const OnboardingScreen = ({
	heading,
	subtitle,
	placeholder,
	sharedElementAlign = "flex-start",
	color = "green",
}: OnboardingScreenProps) => {
	const { ref } = useFocusInput();

	return (
		<Container>
			<View style={{ gap: 48 }}>
				<View>
					<Typography.Heading>{heading}</Typography.Heading>
					<Typography.Subtitle>{subtitle}</Typography.Subtitle>
				</View>
				<Transition.View
					style={{
						width: 100,
						height: 100,
						backgroundColor: color,
						alignSelf: sharedElementAlign,
					}}
					sharedBoundTag="SHARED"
				/>
				<Input ref={ref} placeholder={placeholder} />
			</View>
		</Container>
	);
};
