import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import { useBlankStackStore } from "../../stack/blank-stack.provider";
import type { DescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { deriveDescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import {
	type BuilderAnimationState,
	useBuilderAnimationState,
} from "./hooks/use-builder-animation-state";

import { useMaybeBlockVisibility } from "./hooks/use-maybe-block-visibility";
import { useScreenReady } from "./hooks/use-screen-ready";
import { useScreenTopology } from "./hooks/use-screen-topology";

export type BaseDescriptor = BaseStackDescriptor;

export interface DescriptorsContextValue {
	previous?: BaseDescriptor;
	current: BaseDescriptor;
	next?: BaseDescriptor;
}

export type DescriptorDerivationsContextValue = DescriptorDerivations;

interface BuilderStoreValue {
	descriptors: DescriptorsContextValue;
	derivations: DescriptorDerivationsContextValue;
	options: BaseDescriptor["options"];
	animationState: BuilderAnimationState;
	screenReady: SharedValue<number>;
	visibilityBlocked: SharedValue<boolean>;
}

type BuilderProviderProps = {
	children: ReactNode;
	routeKey: string;
};

const createBuilderProvider = createProvider("Builder", {
	global: true,
})<BuilderProviderProps, BuilderStoreValue>;

const {
	StoreProvider: BuilderStoreProvider,
	getBuilderStore,
	BuilderProvider,
	useBuilderStore,
	useOptionalBuilderStore,
}: ReturnType<typeof createBuilderProvider> = createBuilderProvider(
	({ routeKey, children }) => {
		const scene = useBlankStackStore((s) => s.scenesByKey[routeKey]);

		const currentDescriptor = scene.descriptor;
		const previousDescriptor = scene.previousDescriptor;
		const nextDescriptor = scene.nextDescriptor;
		const options = scene.descriptor.options;

		const descriptors = useMemo(() => {
			return {
				previous: previousDescriptor,
				current: currentDescriptor,
				next: nextDescriptor,
			};
		}, [previousDescriptor, currentDescriptor, nextDescriptor]);

		const derivations = useMemo(() => {
			return deriveDescriptorDerivations({
				previous: previousDescriptor,
				current: currentDescriptor,
				next: nextDescriptor,
			});
		}, [previousDescriptor, currentDescriptor, nextDescriptor]);

		const parentScreenKey = useOptionalBuilderStore(
			(store) => store?.derivations.currentScreenKey,
		);
		const navigatorKey = useBlankStackStore((store) => store.navigatorKey);
		const isActiveScreen = useBlankStackStore((store) => {
			const focusedScene = store.scenes[store.focusedIndex];
			return (
				focusedScene?.route.key === routeKey &&
				focusedScene.activity === "active"
			);
		});
		useScreenTopology({
			screenKey: derivations.currentScreenKey,
			navigatorKey,
			parentScreenKey,
			transitionKey: options.transitionKey,
			isActiveScreen,
		});

		const animationState = useBuilderAnimationState();
		const ancestorVisibilityBlocked = useOptionalBuilderStore(
			(store) => store?.visibilityBlocked ?? null,
		);

		const { animatedStyle, animatedProps, visibilityBlocked } =
			useMaybeBlockVisibility({
				currentScreenKey: derivations.currentScreenKey,
				ancestorVisibilityBlocked,
				animationState,
			});

		const screenReady = useScreenReady(
			derivations.currentScreenKey,
			!!options.screenStyleInterpolator,
			animationState,
		);

		const value = useMemo(() => {
			return {
				descriptors,
				derivations,
				options,
				animationState,
				screenReady,
				visibilityBlocked,
			};
		}, [
			descriptors,
			derivations,
			options,
			screenReady,
			visibilityBlocked,
			animationState,
		]);

		const content = useMemo(
			() => (
				<Animated.View
					style={[styles.container, animatedStyle]}
					animatedProps={animatedProps}
				>
					{children}
				</Animated.View>
			),
			[children, animatedStyle, animatedProps],
		);

		return {
			key: routeKey,
			value,
			children: content,
		};
	},
);

export {
	BuilderProvider,
	BuilderStoreProvider,
	getBuilderStore,
	useBuilderStore,
	useOptionalBuilderStore,
};

const styles = StyleSheet.create({ container: { flex: 1 } });
