import { useState } from "react";
import { ScrollView, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { BottomNav } from "../components/bottom-nav";
import MainExample from "../components/main-example";
import MocksExample from "../components/mocks-example";

const TransitionScrollView =
	Transition.createTransitionAwareComponent(ScrollView);

export function Home() {
	const [activeSegment, setActiveSegment] = useState(0);
	return (
		<View style={{ backgroundColor: "white", flex: 1 }}>
			<TransitionScrollView
				contentContainerStyle={{
					paddingVertical: 100,
					gap: 32,
				}}
			>
				{activeSegment === 0 ? <MainExample /> : <MocksExample />}
			</TransitionScrollView>
			<BottomNav
				activeSegment={activeSegment}
				setActiveSegment={setActiveSegment}
			/>
		</View>
	);
}
