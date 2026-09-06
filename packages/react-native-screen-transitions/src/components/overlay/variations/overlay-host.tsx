import { memo, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
	type SharedValue,
	useDerivedValue,
} from "react-native-reanimated";
import { snapDescriptorToIndex } from "../../../animation/snap-to";
import { useOptionalMotionStore } from "../../../providers/screen/motion";
import { useOptionalOrchestratorStore } from "../../../providers/screen/orchestrator";
import {
	OrchestratorProvider,
	type OrchestratorState,
} from "../../../providers/screen/orchestrator/orchestrator.provider";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import type { OverlayProps } from "../../../types/overlay.types";
import type { FloatOverlayEntry } from "../helpers/get-active-overlay";
import {
	type ReadyOverlayResources,
	retainReadyOverlayResources,
} from "../helpers/retain-ready-overlay-resources";
import { useOverlaySlot } from "../hooks/use-overlay-slot";

type OverlayHostProps = {
	scene: FloatOverlayEntry["scene"];
	driverScene: FloatOverlayEntry["scene"];
	previousOverlayScene?: FloatOverlayEntry["scene"];
	layerIndex: number;
};

export const OverlayHost = memo(function OverlayHost({
	scene,
	driverScene,
	previousOverlayScene,
	layerIndex,
}: OverlayHostProps) {
	const overlayAnimationStore = useOptionalOrchestratorStore(scene.route.key);
	const driverAnimationStore = useOptionalOrchestratorStore(
		driverScene.route.key,
	);
	const previousOverlayAnimationStore = useOptionalOrchestratorStore(
		previousOverlayScene?.route.key ?? scene.route.key,
	);
	const driverScreenReady = useOptionalMotionStore(
		driverScene.route.key,
		(store) => store.screenReady,
	);
	const overlayComponentRef = useRef(scene.descriptor.options.overlay);
	const OverlayComponent = overlayComponentRef.current;
	const readyResourcesRef = useRef<ReadyOverlayResources | null>(null);
	readyResourcesRef.current = retainReadyOverlayResources(
		readyResourcesRef.current,
		overlayAnimationStore,
		driverScene,
		driverAnimationStore,
		driverScreenReady,
	);
	const readyResources = readyResourcesRef.current;

	if (!OverlayComponent || !readyResources) {
		return null;
	}

	return (
		<ReadyOverlayHost
			scene={scene}
			driverScene={readyResources.driverScene}
			layerIndex={layerIndex}
			overlayAnimationStore={readyResources.overlayAnimationStore}
			driverAnimationStore={readyResources.driverAnimationStore}
			previousOverlayAnimationStore={
				previousOverlayScene ? previousOverlayAnimationStore : undefined
			}
			driverScreenReady={readyResources.driverScreenReady}
			OverlayComponent={OverlayComponent}
		/>
	);
});

type ReadyOverlayHostProps = OverlayHostProps & {
	overlayAnimationStore: OrchestratorState;
	driverAnimationStore: OrchestratorState;
	previousOverlayAnimationStore?: OrchestratorState | null;
	driverScreenReady: SharedValue<number>;
	OverlayComponent: NonNullable<
		FloatOverlayEntry["scene"]["descriptor"]["options"]["overlay"]
	>;
};

function ReadyOverlayHost({
	scene,
	driverScene,
	layerIndex,
	overlayAnimationStore,
	driverAnimationStore,
	previousOverlayAnimationStore,
	driverScreenReady,
	OverlayComponent,
}: ReadyOverlayHostProps) {
	const { scenes, focusedIndex, routeKeys, routes } = useBlankStackStore();
	const focusedScene = scenes[focusedIndex] ?? scenes[scenes.length - 1];
	const focusedDescriptor = focusedScene?.descriptor;
	const { animatedProps, animatedStyle } = useOverlaySlot({
		overlayAnimationStore,
		overlayInterpolator: scene.descriptor.options.screenStyleInterpolator,
		driverAnimationStore,
		previousOverlayAnimationStore: previousOverlayAnimationStore ?? undefined,
		driverInterpolator: driverScene.descriptor.options.screenStyleInterpolator,
		screenReady: driverScreenReady,
		isIncoming: scene.route.key === driverScene.route.key,
	});
	const relativeProgress = useDerivedValue(() => {
		"worklet";
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
			pointerEvents="box-none"
			style={[
				styles.container,
				styles.floating,
				StyleSheet.absoluteFill,
				{ zIndex: 1000 + layerIndex },
				animatedStyle,
			]}
		>
			<OrchestratorProvider screenKey={scene.route.key}>
				<View
					pointerEvents="box-none"
					style={[StyleSheet.absoluteFill, styles.overlay]}
				>
					<OverlayComponent {...overlayProps} />
				</View>
			</OrchestratorProvider>
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
