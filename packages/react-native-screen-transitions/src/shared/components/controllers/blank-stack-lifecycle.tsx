import { useLayoutEffect } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import type { BlankStackDescriptor } from "../../../blank-stack/types";
import { useStackNavigationContext } from "../../../blank-stack/utils/with-stack-navigation";
import { useParentGestureRegistry } from "../../hooks/gestures/use-parent-gesture-registry";
import useStableCallback from "../../hooks/use-stable-callback";
import { useKeys } from "../../providers/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";
import { resetStoresForScreen } from "../../utils/reset-stores-for-screen";

export interface Props {
	children: React.ReactNode;
}

/**
 * Lifecycle controller built out for Blank Stack implementation.
 */
export const BlankStackScreenLifecycleController = ({ children }: Props) => {
	const { current } = useKeys<BlankStackDescriptor>();
	const { handleCloseRoute, closingRouteKeysShared } =
		useStackNavigationContext();

	const animations = AnimationStore.getAll(current.route.key);

	const handleInitialize = useStableCallback(() => {
		startScreenTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
		});
	});

	const handleCleanup = useStableCallback(() => {
		resetStoresForScreen(current);
	});

	const handleCloseEnd = useStableCallback((finished: boolean) => {
		if (!finished) {
			return;
		}
		handleCloseRoute({ route: current.route });
	});

	useAnimatedReaction(
		() => ({
			keys: closingRouteKeysShared.value,
		}),
		({ keys }) => {
			if (!keys.includes(current.route.key)) {
				return;
			}

			startScreenTransition({
				target: "close",
				spec: current.options.transitionSpec,
				animations,
				onAnimationFinish: handleCloseEnd,
			});
		},
	);

	useLayoutEffect(() => {
		handleInitialize();
		return () => {
			handleCleanup();
		};
	}, [handleInitialize, handleCleanup]);

	return children;
};
