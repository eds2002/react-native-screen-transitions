import { useLayoutEffect } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { useHighRefreshRate } from "../../shared/hooks/animation/use-high-refresh-rate";
import useStableCallback from "../../shared/hooks/use-stable-callback";
import { useKeys } from "../../shared/providers/screen/keys.provider";
import { useManagedStackContext } from "../../shared/providers/stack/managed.provider";
import { AnimationStore } from "../../shared/stores/animation.store";
import { startScreenTransition } from "../../shared/utils/animation/start-screen-transition";
import { resetStoresForScreen } from "../../shared/utils/reset-stores-for-screen";
import type { ComponentStackDescriptor } from "../types";

interface Props {
	children: React.ReactNode;
}

/**
 * Lifecycle controller built out for Component Stack implementation.
 */
export const ComponentStackScreenLifecycleController = ({ children }: Props) => {
	const { current } = useKeys<ComponentStackDescriptor>();
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

	const handleCleanup = useStableCallback(() => {
		resetStoresForScreen(current);
	});

	const handleCloseEnd = useStableCallback((finished: boolean) => {
		deactivateHighRefreshRate();
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
		return () => {
			handleCleanup();
		};
	}, [handleInitialize, handleCleanup]);

	return children;
};
