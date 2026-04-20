import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { useStack } from "../../../hooks/navigation/use-stack";
import { useSharedValueState } from "../../../hooks/reanimated/use-shared-value-state";
import { useManagedStackContext } from "../../../providers/stack/managed.provider";
import { AnimationStore } from "../../../stores/animation.store";
import { type NativeScreenState, resolveNativeScreenState } from "../helpers";

interface Props {
	routeKey: string;
	routeKeys: string[];
	index: number;
	isPreloaded: boolean;
}

export const useScreenActivityState = ({
	routeKey,
	routeKeys,
	index,
	isPreloaded,
}: Props) => {
	const { routes, optimisticFocusedIndex } = useStack();
	const { backdropBehaviors } = useManagedStackContext();

	const routesLength = routes.length;

	const sceneClosing = AnimationStore.getValue(routeKey, "closing");

	const closingStatesByIndex = routeKeys.map((key) =>
		AnimationStore.getValue(key, "closing"),
	);

	const contentState = useSharedValue<NativeScreenState>("inert");

	const nextBackdropBehavior = backdropBehaviors[index + 1];

	useAnimatedReaction(
		() => {
			"worklet";

			const focusedIndex = optimisticFocusedIndex.get();

			let shouldRetainAcrossClosingGap = false;

			// When the stack becomes `A / B(closing) / C`, `A` is still the previous
			// live screen for `C`. Keep it alive if every route between this screen and
			// the focused screen is already closing.
			if (index < focusedIndex - 1) {
				shouldRetainAcrossClosingGap = true;

				for (let i = index + 1; i < focusedIndex; i++) {
					if (closingStatesByIndex[i]?.get() > 0) {
						continue;
					}

					shouldRetainAcrossClosingGap = false;
					break;
				}
			}

			return resolveNativeScreenState({
				index,
				routesLength,
				isPreloaded,
				focusedIndex,
				isClosing: sceneClosing.get(),
				shouldRetainAcrossClosingGap,
				nextBackdropBehavior,
			});
		},
		(nextState, previousState) => {
			"worklet";

			if (Object.is(nextState, previousState)) {
				return;
			}

			contentState.set(nextState);
		},
	);

	return useSharedValueState(contentState);
};
