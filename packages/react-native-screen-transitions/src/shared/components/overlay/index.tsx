import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import { memo, useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";
import { snapDescriptorToIndex } from "../../animation/snap-to";
import { useStack } from "../../hooks/navigation/use-stack";
import { ScreenAnimationProvider } from "../../providers/screen/animation";
import type { BaseDescriptor } from "../../providers/screen/descriptors";
import { DescriptorsProvider } from "../../providers/screen/descriptors";
import { ScreenStylesProvider } from "../../providers/screen/styles";
import { useOptimisticFocusedIndex } from "../../providers/stack/helpers/use-optimistic-focused-index";
import type {
	OverlayProps,
	OverlayScreenState,
} from "../../types/overlay.types";
import { logger } from "../../utils/logger";
import { getActiveFloatOverlay } from "./helpers/get-active-overlay";

/**
 * Float overlay component that renders above all screens.
 * Gets routes and descriptors from stack context.
 */
export const Overlay = memo(function Overlay() {
	const {
		scenes,
		optimisticFocusedIndex,
		flags,
		routes,
		routeKeys,
		stackProgress,
	} = useStack();

	const focusedIndex = useOptimisticFocusedIndex(
		optimisticFocusedIndex,
		routeKeys.length,
	);

	const overlayData = useMemo(() => {
		const activeOverlay = getActiveFloatOverlay(
			scenes,
			flags.TRANSITIONS_ALWAYS_ON,
		);

		if (!activeOverlay) return null;

		const { scene, overlayIndex } = activeOverlay;
		const previous = scenes[overlayIndex - 1]?.descriptor;
		const current = scene.descriptor;
		const next = scenes[overlayIndex + 1]?.descriptor;
		const OverlayComponent = current.options.overlay;

		if (!OverlayComponent) {
			logger.warn(
				`Active overlay route "${current.route.key}" is missing an overlay component`,
			);
			return;
		}

		const routeIndex = routeKeys.indexOf(current.route.key);

		const focusedScene = scenes[focusedIndex] ?? scenes[scenes.length - 1];
		const focusedDescriptor = focusedScene?.descriptor;

		const overlayScreenState: OverlayScreenState<BaseDescriptor["navigation"]> =
			{
				index: routeIndex,
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
			overlayIndex,
			OverlayComponent,
			overlayScreenState,
		};
	}, [scenes, flags.TRANSITIONS_ALWAYS_ON, focusedIndex, routeKeys, routes]);

	const overlayIndex = overlayData?.overlayIndex ?? -1;

	const relativeProgress = useDerivedValue(() => {
		"worklet";
		if (overlayIndex < 0) {
			return 0;
		}

		return stackProgress.get() - overlayIndex;
	});

	const overlayProps = useMemo<OverlayProps<
		BaseDescriptor["navigation"]
	> | null>(
		() =>
			overlayData
				? {
						...overlayData.overlayScreenState,
						progress: relativeProgress,
					}
				: null,
		[relativeProgress, overlayData],
	);

	if (!overlayData || !overlayProps) {
		return null;
	}

	const { scene, previous, current, next, OverlayComponent } = overlayData;

	return (
		<NavigationContext.Provider value={scene.descriptor.navigation as any}>
			<NavigationRouteContext.Provider value={scene.route}>
				<DescriptorsProvider current={current} previous={previous} next={next}>
					<ScreenAnimationProvider>
						<ScreenStylesProvider isFloatingOverlay>
							<OverlayComponent {...overlayProps} />
						</ScreenStylesProvider>
					</ScreenAnimationProvider>
				</DescriptorsProvider>
			</NavigationRouteContext.Provider>
		</NavigationContext.Provider>
	);
});
