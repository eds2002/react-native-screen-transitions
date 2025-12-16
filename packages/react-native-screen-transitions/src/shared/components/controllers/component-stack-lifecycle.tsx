import { useLayoutEffect } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import type { ComponentStackDescriptor } from "../../../component-stack/types";
import { useComponentNavigationContext } from "../../../component-stack/utils/with-component-navigation";
import useStableCallback from "../../hooks/use-stable-callback";
import { useKeys } from "../../providers/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { BoundStore } from "../../stores/bounds.store";
import { GestureStore } from "../../stores/gesture.store";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";

export interface Props {
	children: React.ReactNode;
}

/**
 * Lifecycle controller built out for Component Stack implementation.
 * Similar to BlankStackScreenLifecycleController but uses component navigation context.
 */
export const ComponentStackScreenLifecycleController = ({ children }: Props) => {
	// Cast since component-stack descriptors don't match React Navigation's type
	const { current } = useKeys() as unknown as { current: ComponentStackDescriptor };
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
