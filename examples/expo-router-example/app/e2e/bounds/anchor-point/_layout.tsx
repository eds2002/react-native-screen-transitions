import { createContext, useContext, useState } from "react";
import Transition from "react-native-screen-transitions";
import { Footer } from "@/components/footer";
import { Stack } from "@/layouts/stack";

type BoundsAnchor =
	| "topLeading"
	| "top"
	| "topTrailing"
	| "leading"
	| "center"
	| "trailing"
	| "bottomLeading"
	| "bottom"
	| "bottomTrailing";

interface AnchorPointContextType {
	anchorPoint: BoundsAnchor;
	setAnchorPoint: (anchor: BoundsAnchor) => void;
}

const AnchorPointContext = createContext<AnchorPointContextType | undefined>(
	undefined,
);

export const useAnchorPoint = () => {
	const context = useContext(AnchorPointContext);
	if (!context) {
		throw new Error("useAnchorPoint must be used within AnchorPointLayout");
	}
	return context;
};

export default function AnchorPointLayout() {
	const [anchorPoint, setAnchorPoint] = useState<BoundsAnchor>("center");

	return (
		<AnchorPointContext.Provider value={{ anchorPoint, setAnchorPoint }}>
			<Stack>
				<Stack.Screen name="index" options={{ headerShown: false }} />
				<Stack.Screen
					name="[id]"
					options={{
						enableTransitions: true,
						screenStyleInterpolator: ({ bounds, activeBoundId }) => {
							"worklet";
							const animation = bounds({
								anchor: anchorPoint,
								scaleMode: "none",
								method: "transform",
								space: "relative",
							});

							return {
								[activeBoundId]: animation,
							};
						},
						transitionSpec: {
							open: Transition.specs.DefaultSpec,
							close: Transition.specs.DefaultSpec,
						},
					}}
				/>
			</Stack>
			<Footer backIcon="chevron-left" />
		</AnchorPointContext.Provider>
	);
}
