import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
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

export type BuilderProviderProps = {
	children: ReactNode;
	routeKey: string;
	descriptors: DescriptorsContextValue;
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
	({ routeKey, children, descriptors: inputDescriptors }) => {
		const currentDescriptor = inputDescriptors.current;
		const previousDescriptor = inputDescriptors.previous;
		const nextDescriptor = inputDescriptors.next;
		const options = currentDescriptor.options;

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

		useScreenTopology(routeKey);

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
