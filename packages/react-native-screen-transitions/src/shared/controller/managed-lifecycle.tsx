import { useLayoutEffect } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import type { BlankStackDescriptor } from "../../blank-stack/types";
import { useHighRefreshRate } from "../hooks/animation/use-high-refresh-rate";
import useStableCallback from "../hooks/use-stable-callback";
import { useKeys } from "../providers/screen/keys.provider";
import { useManagedStackContext } from "../providers/stack/managed.provider";
import { AnimationStore } from "../stores/animation.store";
import { startScreenTransition } from "../utils/animation/start-screen-transition";
import { resetStoresForScreen } from "../utils/reset-stores-for-screen";

interface Props {
	children: React.ReactNode;
}

/**
 * Lifecycle controller built out for Blank Stack implementation.
 */
export const ManagedLifecycle = ({ children }: Props) => {
	const { current } = useKeys<BlankStackDescriptor>();
	const { handleCloseRoute, closingRouteKeysShared } = useManagedStackContext();

	const animations = AnimationStore.getAll(current.route.key);

	const { deactivateHighRefreshRate, activateHighRefreshRate } =
		useHighRefreshRate(current);

	const handleInitialize = useStableCallback(() => {
		activateHighRefreshRate();
		startScreenTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
			onAnimationFinish: deactivateHighRefreshRate,
		});
	});

	const handleCloseEnd = useStableCallback((finished: boolean) => {
		if (!finished) {
			return;
		}
		handleCloseRoute({ route: current.route });
		requestAnimationFrame(() => {
			deactivateHighRefreshRate();
			resetStoresForScreen(current);
		});
	});

	useAnimatedReaction(
		() => ({
			keys: closingRouteKeysShared.value,
		}),
		({ keys }) => {
			if (!keys.includes(current.route.key)) {
				return;
			}

			runOnJS(activateHighRefreshRate)();
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
	}, [handleInitialize]);

	return children;
};
