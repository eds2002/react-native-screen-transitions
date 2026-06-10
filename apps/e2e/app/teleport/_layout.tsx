import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { TELEPORT_GHOST_ID, TELEPORT_PAIRED_ID } from "./constants";

export default function TeleportLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="[mode]"
				options={({ route }) => {
					const mode = (route.params as { mode?: string })?.mode;

					return {
						gestureEnabled: true,
						gestureDirection: "bidirectional",
						gestureProgressMode: "freeform",
						screenStyleInterpolator: ({ bounds }) => {
							"worklet";

							if (mode === "paired") {
								const pairedBounds = bounds({ id: TELEPORT_PAIRED_ID });
								return pairedBounds.navigation.zoom({
									borderRadius: 150,
									target: "bound",
								});
							}

							const ghostBounds = bounds({ id: TELEPORT_GHOST_ID });

							return {
								[TELEPORT_GHOST_ID]: ghostBounds.styles(),
							};
						},
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.FlingSpec,
						},
					};
				}}
			/>
		</BlankStack>
	);
}
