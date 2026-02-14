import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition, {
	buildBoundaryMatchKey,
} from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { activeBoundaryId, BOUNDARY_GROUP, ITEMS } from "./constants";

/** Pre-computed array of all boundary tag keys (simple string[] for worklet capture). */
const ALL_KEYS = ITEMS.map((item) =>
	buildBoundaryMatchKey(BOUNDARY_GROUP, item.id),
);

/**
 * Collects all boundary tag keys that are NOT the currently-active one.
 * These get explicit identity-reset styles so stale animated values don't linger.
 */
const getInactiveKeys = (activeTag: string): string[] => {
	"worklet";
	const keys: string[] = [];
	for (let i = 0; i < ALL_KEYS.length; i++) {
		if (ALL_KEYS[i] !== activeTag) {
			keys.push(ALL_KEYS[i]);
		}
	}
	return keys;
};

const sharedBoundaryInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, progress }) => {
		"worklet";

		const activeId = activeBoundaryId.value;
		const activeTag = `${BOUNDARY_GROUP}:${activeId}`;
		const scale = interpolate(progress, [0, 1, 2], [1, 1, 0.95], "clamp");

		const result: Record<string, any> = {
			// Active boundary: use group-aware bounds() which triggers
			// store activeId update → boundary re-measurement chain
			[activeTag]: {
				...bounds({
					group: BOUNDARY_GROUP,
					id: activeId,
				}),
				opacity: interpolate(progress, [0.2, 0.8, 1, 1.2, 2], [0, 1, 1, 1, 0]),
			},
			contentStyle: {
				transform: [{ scale }],
			},
		};

		// Explicitly reset all inactive boundary keys so stale animated values don't linger.
		// Identity transforms are used because Reanimated's useAnimatedStyle doesn't
		// reliably clear previously-set transform arrays.
		const inactive = getInactiveKeys(activeTag);
		for (let i = 0; i < inactive.length; i++) {
			result[inactive[i]] = {
				transform: [
					{ translateX: 0 },
					{ translateY: 0 },
					{ scaleX: 1 },
					{ scaleY: 1 },
				],
				opacity: 1,
			};
		}

		return result;
	};

export default function BoundsLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="[id]"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical-inverted", "vertical"],
					screenStyleInterpolator: sharedBoundaryInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</BlankStack>
	);
}
