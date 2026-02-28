import { useMemo } from "react";
import { snapDescriptorToIndex } from "../../../animation/snap-to";
import { useOptimisticFocusedIndex } from "../../../hooks/navigation/use-optimistic-focused-index";
import { useStack } from "../../../hooks/navigation/use-stack";
import { ScreenAnimationProvider } from "../../../providers/screen/animation";
import type { BaseDescriptor } from "../../../providers/screen/descriptors";
import { DescriptorsProvider } from "../../../providers/screen/descriptors";
import { ScreenStylesProvider } from "../../../providers/screen/styles.provider";
import type { OverlayScreenState } from "../../../types/overlay.types";

import { getActiveFloatOverlay } from "../helpers/get-active-overlay";
import { OverlayHost } from "./overlay-host";

/**
 * Float overlay component that renders above all screens.
 * Gets routes and descriptors from stack context.
 */
export function FloatOverlay() {
	const { scenes, optimisticFocusedIndex, flags, routes, routeKeys } =
		useStack();
	const focusedIndex = useOptimisticFocusedIndex(
		optimisticFocusedIndex,
		routeKeys.length,
	);

	const activeOverlay = useMemo(
		() =>
			getActiveFloatOverlay(scenes, focusedIndex, flags.TRANSITIONS_ALWAYS_ON),
		[scenes, focusedIndex, flags.TRANSITIONS_ALWAYS_ON],
	);

	const overlayData = useMemo(() => {
		if (!activeOverlay) return null;

		const { scene, overlayIndex } = activeOverlay;
		const previous = scenes[overlayIndex - 1]?.descriptor;
		const current = scene.descriptor;
		const next = scenes[overlayIndex + 1]?.descriptor;
		const focusedScene = scenes[focusedIndex] ?? scenes[scenes.length - 1];
		const focusedDescriptor = focusedScene?.descriptor;

		const overlayScreenState: OverlayScreenState<BaseDescriptor["navigation"]> =
			{
				index: routeKeys.indexOf(current.route.key),
				options: focusedDescriptor?.options ?? {},
				routes,
				focusedRoute: focusedScene?.route ?? current.route,
				focusedIndex,
				meta: focusedDescriptor?.options?.meta,
				navigation: current.navigation,
				snapTo: (index: number) => {
					snapDescriptorToIndex(current, index);
				},
			};

		return {
			scene,
			previous,
			current,
			next,
			overlayScreenState,
		};
	}, [activeOverlay, scenes, focusedIndex, routeKeys, routes]);

	if (!overlayData) {
		return null;
	}

	const { scene, previous, current, next, overlayScreenState } = overlayData;

	return (
		<DescriptorsProvider current={current} previous={previous} next={next}>
			<ScreenAnimationProvider>
				<ScreenStylesProvider>
					<OverlayHost scene={scene} overlayScreenState={overlayScreenState} />
				</ScreenStylesProvider>
			</ScreenAnimationProvider>
		</DescriptorsProvider>
	);
}
