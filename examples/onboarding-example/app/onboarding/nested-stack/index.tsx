import Transition from "react-native-screen-transitions";
import { Container } from "@/components/container";

export default function App() {
	return (
		<Container>
			<Transition.View
				style={{
					width: 100,
					height: 100,
					backgroundColor: "green",
					alignSelf: "center",
				}}
				sharedBoundTag="SHARED"
			/>
		</Container>
	);
}
