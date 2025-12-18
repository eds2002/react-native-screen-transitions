import { useLayoutEffect } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
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
 * Uses the shared ManagedStackContext for closing route handling.
 */
export const ComponentStackScreenLifecycleController = ({ children }: Props) => {
	const { current } = useKeys<ComponentStackDescriptor>();
	const { handleCloseRoute, closingRouteKeysShared } = useManagedStackContext();

	const animations = AnimationStore.getAll(current.route.key);

	const handleInitialize = useStableCallback(() => {
		startScreenTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
		});
	});

	const handleCleanup = useStableCallback(() => {
		// Type assertion needed because ComponentStackDescriptor differs from TransitionDescriptor
		// but resetStoresForScreen only uses route.key internally
		resetStoresForScreen(
			current as unknown as Parameters<typeof resetStoresForScreen>[0],
		);
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
