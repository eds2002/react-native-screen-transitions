import { useLayoutEffect } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import useStableCallback from "../../shared/hooks/use-stable-callback";
import { useKeys } from "../../shared/providers/keys.provider";
import { AnimationStore } from "../../shared/stores/animation.store";
import { BoundStore } from "../../shared/stores/bounds.store";
import { GestureStore } from "../../shared/stores/gesture.store";
import { startScreenTransition } from "../../shared/utils/animation/start-screen-transition";
import type { ComponentStackDescriptor } from "../types";
import { useComponentNavigationContext } from "../utils/with-component-navigation";

interface Props {
	children: React.ReactNode;
}

/**
 * Lifecycle controller built out for Component Stack implementation.
 * Similar to BlankStackScreenLifecycleController but uses component navigation context.
 */
export const ComponentStackScreenLifecycleController = ({ children }: Props) => {
	const { current } = useKeys<ComponentStackDescriptor>();
	const { handleCloseRoute, closingRouteKeysShared } =
		useComponentNavigationContext();

	const animations = AnimationStore.getAll(current.route.key);

	const handleInitialize = useStableCallback(() => {
		startScreenTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
		});
	});

	const handleCleanup = useStableCallback(() => {
		// Inline reset since resetStoresForScreen expects TransitionDescriptor
		AnimationStore.clear(current.route.key);
		GestureStore.clear(current.route.key);
		BoundStore.clear(current.route.key);
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
