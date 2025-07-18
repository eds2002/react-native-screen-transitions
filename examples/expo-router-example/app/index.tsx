import { Fragment, useState } from "react";
import { ScrollView } from "react-native";
import Transition from "react-native-screen-transitions";
import { BottomNav } from "@/components/bottom-nav";
import MainExample from "@/components/main-example";
import MocksExample from "@/components/mocks-example";

const TransitionScrollView = Transition.createTransitionComponent(ScrollView);
export default function Home() {
	const [activeSegment, setActiveSegment] = useState(0);
	return (
		<Fragment>
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
		</Fragment>
	);
}
