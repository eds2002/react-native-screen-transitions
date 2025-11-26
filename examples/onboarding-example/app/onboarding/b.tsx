import { View } from "react-native";
import Transition from "react-native-screen-transitions";
import { Container } from "@/components/container";
import { Input } from "@/components/input";
import { Typography } from "@/components/typography";
import { useFocusInput } from "@/hooks/use-focus-input";

export default function App() {
	const { ref } = useFocusInput();
	return (
		<Container>
			<View style={{ gap: 48 }}>
				<View>
					<Typography.Heading>Your nickname</Typography.Heading>
					<Typography.Subtitle>
						Just so we know what to call you
					</Typography.Subtitle>
					<Transition.View
						style={{ width: 100, height: 100, backgroundColor: "green" }}
						sharedBoundTag="SHARED"
					/>
				</View>
				<Input ref={ref} placeholder="Jerry" autoFocus />
			</View>
		</Container>
	);
}
