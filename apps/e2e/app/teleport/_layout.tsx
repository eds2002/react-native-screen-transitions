import type {
	AnimatedViewStyle,
	ScreenTransitionConfig,
} from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import {
	TELEPORT_GHOST_ID,
	TELEPORT_PAIRED_ID,
	type TeleportMode,
} from "./constants";

const getTeleportMode = (value: unknown): TeleportMode => {
	return value === "paired" ? "paired" : "ghost";
};

const createTeleportScreenStyleInterpolator = (
	mode: TeleportMode,
): ScreenTransitionConfig["screenStyleInterpolator"] => {
	return ({ bounds }) => {
		"worklet";

		if (mode === "paired") {
			const pairedBounds = bounds({ id: TELEPORT_PAIRED_ID });

			return pairedBounds.navigation.zoom({
				borderRadius: 150,
				target: "bound",
			});
		}

		const ghostBounds = bounds({ id: TELEPORT_GHOST_ID }).navigation.zoom({
			borderRadius: 150,
			target: "bound",
		});

		return ghostBounds;
	};
};

export default function TeleportLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="[mode]"
				options={({ route }) => {
					const mode = getTeleportMode(
						(route.params as { mode?: unknown } | undefined)?.mode,
					);

					return {
						gestureEnabled: true,
						gestureDirection: "bidirectional",
						gestureProgressMode: "freeform",
						screenStyleInterpolator:
							createTeleportScreenStyleInterpolator(mode),
						inactiveBehavior: "keep",
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
