import { useLayoutEffect } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import useStableCallback from "../../shared/hooks/use-stable-callback";
import { useKeys } from "../../shared/providers/keys.provider";
import { AnimationStore } from "../../shared/stores/animation.store";
import { startScreenTransition } from "../../shared/utils/animation/start-screen-transition";
import { resetStoresForScreen } from "../../shared/utils/reset-stores-for-screen";
import type { BlankStackDescriptor } from "../types";
import { useStackNavigationContext } from "../utils/with-stack-navigation";

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
