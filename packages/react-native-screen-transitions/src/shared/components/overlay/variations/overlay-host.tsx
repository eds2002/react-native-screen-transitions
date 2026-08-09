import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import { memo, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useDerivedValue } from "react-native-reanimated";
import { snapDescriptorToIndex } from "../../../animation/snap-to";
import { useStack } from "../../../hooks/navigation/use-stack";
import { useScreenAnimationStore } from "../../../providers/screen/animation";
import type { ScreenAnimationContextValue } from "../../../providers/screen/animation/animation.provider";
import {
	type ScreenSlotContextValue,
	useScreenSlots,
} from "../../../providers/screen/styles/slot.provider";
import type { OverlayProps } from "../../../types/overlay.types";
import type {
	FloatOverlayActivity,
	FloatOverlayEntry,
} from "../helpers/get-active-overlay";
import {
	type ReadyOverlayResources,
	retainReadyOverlayResources,
} from "../helpers/retain-ready-overlay-resources";
import { useOverlaySlot } from "../hooks/use-overlay-slot";

type OverlayHostProps = {
	scene: FloatOverlayEntry["scene"];
	driverScene: FloatOverlayEntry["scene"];
	previousOverlayScene?: FloatOverlayEntry["scene"];
	activity: FloatOverlayActivity;
	layerIndex: number;
};

export const OverlayHost = memo(function OverlayHost({
	scene,
	driverScene,
	previousOverlayScene,
	activity,
	layerIndex,
}: OverlayHostProps) {
	const overlayAnimationStore = useScreenAnimationStore(scene.route.key);
	const driverAnimationStore = useScreenAnimationStore(driverScene.route.key);
	const previousOverlayAnimationStore = useScreenAnimationStore(
		previousOverlayScene?.route.key ?? scene.route.key,
	);
	const driverSlots = useScreenSlots(driverScene.route.key);
	const overlayComponentRef = useRef(scene.descriptor.options.overlay);
	const OverlayComponent = overlayComponentRef.current;
	const readyResourcesRef = useRef<ReadyOverlayResources | null>(null);
	readyResourcesRef.current = retainReadyOverlayResources(
		readyResourcesRef.current,
		overlayAnimationStore,
		driverScene,
		driverAnimationStore,
		driverSlots,
	);
	const readyResources = readyResourcesRef.current;

	if (!OverlayComponent || !readyResources) {
		return null;
	}

	return (
		<ReadyOverlayHost
			scene={scene}
			driverScene={readyResources.driverScene}
			activity={activity}
			layerIndex={layerIndex}
			overlayAnimationStore={readyResources.overlayAnimationStore}
			driverAnimationStore={readyResources.driverAnimationStore}
			previousOverlayAnimationStore={
				previousOverlayScene ? previousOverlayAnimationStore : undefined
			}
			driverSlots={readyResources.driverSlots}
			OverlayComponent={OverlayComponent}
		/>
	);
});

type ReadyOverlayHostProps = OverlayHostProps & {
	overlayAnimationStore: ScreenAnimationContextValue;
	driverAnimationStore: ScreenAnimationContextValue;
	previousOverlayAnimationStore?: ScreenAnimationContextValue | null;
	driverSlots: ScreenSlotContextValue;
	OverlayComponent: NonNullable<
		FloatOverlayEntry["scene"]["descriptor"]["options"]["overlay"]
	>;
};

function ReadyOverlayHost({
	scene,
	driverScene,
	activity,
	layerIndex,
	overlayAnimationStore,
	driverAnimationStore,
	previousOverlayAnimationStore,
	driverSlots,
	OverlayComponent,
}: ReadyOverlayHostProps) {
	const { scenes, focusedIndex, routeKeys, routes } = useStack();
	const descriptor = scene.descriptor;
	const focusedScene = scenes[focusedIndex] ?? scenes[scenes.length - 1];
	const focusedDescriptor = focusedScene?.descriptor;
	const { animatedProps, animatedStyle } = useOverlaySlot({
		overlayAnimationStore,
		driverAnimationStore,
		previousOverlayAnimationStore: previousOverlayAnimationStore ?? undefined,
		driverInterpolator: driverScene.descriptor.options.screenStyleInterpolator,
		interpolatorReady: driverSlots.interpolatorReady,
		isIncoming: scene.route.key === driverScene.route.key,
	});
	const relativeProgress = useDerivedValue(() => {
		"worklet";
		overlayAnimationStore.screenInterpolatorPropsRevision.get();
		return overlayAnimationStore.screenInterpolatorProps.get().stackProgress;
	});

	const overlayProps: OverlayProps = useMemo(
		() => ({
			route: scene.route,
			index: routeKeys.indexOf(scene.route.key),
			options: focusedDescriptor?.options ?? {},
			routes,
			focusedRoute: focusedScene?.route ?? scene.route,
			focusedIndex,
			meta: focusedDescriptor?.options?.meta,
			navigation: scene.descriptor.navigation,
			snapTo: (index: number) => {
				snapDescriptorToIndex(scene.descriptor, index);
			},
			progress: relativeProgress,
		}),
		[
			scene,
			focusedDescriptor?.options,
			focusedIndex,
			focusedScene?.route,
			relativeProgress,
			routeKeys,
			routes,
		],
	);
	return (
		<Animated.View
			animatedProps={animatedProps}
			pointerEvents={activity === "active" ? "box-none" : "none"}
			style={[
				styles.container,
				styles.floating,
				StyleSheet.absoluteFill,
				{ zIndex: 1000 + layerIndex },
				animatedStyle,
			]}
		>
			<NavigationContext.Provider value={descriptor.navigation as any}>
				<NavigationRouteContext.Provider value={descriptor.route}>
					<View
						pointerEvents="box-none"
						style={[StyleSheet.absoluteFill, styles.overlay]}
					>
						<OverlayComponent {...overlayProps} />
					</View>
				</NavigationRouteContext.Provider>
			</NavigationContext.Provider>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		zIndex: 1,
	},
	container: {
		flex: 1,
	},
	floating: {
		zIndex: 1000,
	},
});
