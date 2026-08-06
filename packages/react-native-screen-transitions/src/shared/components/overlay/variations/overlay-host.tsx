import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useDerivedValue } from "react-native-reanimated";
import { snapDescriptorToIndex } from "../../../animation/snap-to";
import { useStack } from "../../../hooks/navigation/use-stack";
import { useScreenAnimationStore } from "../../../providers/screen/animation";
import type { OverlayProps } from "../../../types/overlay.types";
import type {
	FloatOverlayActivity,
	FloatOverlayEntry,
} from "../helpers/get-active-overlay";

type OverlayHostProps = {
	scene: FloatOverlayEntry["scene"];
	activity: FloatOverlayActivity;
	layerIndex: number;
};

export function OverlayHost({ scene, activity, layerIndex }: OverlayHostProps) {
	const screenAnimationStore = useScreenAnimationStore(scene.route.key);
	const { scenes, focusedIndex, routeKeys, routes } = useStack();
	const descriptor = scene.descriptor;
	const focusedScene = scenes[focusedIndex] ?? scenes[scenes.length - 1];
	const focusedDescriptor = focusedScene?.descriptor;
	const relativeProgress = useDerivedValue(() => {
		"worklet";
		if (!screenAnimationStore) {
			return 0;
		}

		screenAnimationStore.screenInterpolatorPropsRevision.get();
		return screenAnimationStore.screenInterpolatorProps.get().stackProgress;
	});

	const overlayProps: OverlayProps = useMemo(
		() => ({
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
	const OverlayComponent = descriptor.options.overlay;

	if (!OverlayComponent || !screenAnimationStore) {
		return null;
	}

	return (
		<Animated.View
			pointerEvents={activity === "active" ? "box-none" : "none"}
			style={[
				styles.container,
				styles.floating,
				StyleSheet.absoluteFill,
				{ zIndex: 1000 + layerIndex },
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
