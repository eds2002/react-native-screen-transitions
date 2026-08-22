import { type ReactNode, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import type {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import createProvider from "../../../utils/create-provider";
import { useDescriptorsStore } from "../descriptors";
import { useCurrentScreenRelationships } from "../use-current-screen-relationships";
import { useInterpolatedStylesMap } from "./hooks/use-interpolated-style-maps";
import { useMaybeBlockVisibility } from "./hooks/use-maybe-block-visibility";
import { useResolvedStylesMap } from "./hooks/use-resolved-slot-style-map";

type Props = { children: ReactNode };

export type ScreenSlotName =
	| "overlay"
	| "content"
	| "surface"
	| "backdrop"
	| typeof NAVIGATION_MASK_CONTAINER_STYLE_ID
	| typeof NAVIGATION_MASK_ELEMENT_STYLE_ID;

export type ScreenSlotContextValue = {
	interpolatorReady: SharedValue<number>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	visibilityBlocked: SharedValue<boolean>;
};

const createScreenSlotProvider = createProvider("ScreenSlot", {
	global: true,
})<Props, ScreenSlotContextValue>;

export const {
	ScreenSlotProvider,
	useOptionalScreenSlotStore,
	useScreenSlotStore,
}: ReturnType<typeof createScreenSlotProvider> = createScreenSlotProvider(
	({ children }) => {
		const currentScreenKey = useDescriptorsStore(
			(store) => store.derivations.currentScreenKey,
		);
		const { parentScreenKey } = useCurrentScreenRelationships();
		const ancestorStylesMap = useOptionalScreenSlotStore(
			parentScreenKey,
			(store) => store.slotsMap,
		);
		const ancestorVisibilityBlocked = useOptionalScreenSlotStore(
			parentScreenKey,
			(store) => store.visibilityBlocked,
		);
		const { animatedStyle, animatedProps, visibilityBlocked } =
			useMaybeBlockVisibility({
				ancestorVisibilityBlocked: ancestorVisibilityBlocked ?? null,
			});
		const { interpolatorReady, localStylesMaps } = useInterpolatedStylesMap({
			enabled: true,
			visibilityBlocked,
		});
		const slotsMap = useResolvedStylesMap({
			localStylesMaps,
			ancestorStylesMap: ancestorStylesMap ?? undefined,
		});
		const value = useMemo(
			() => ({ interpolatorReady, slotsMap, visibilityBlocked }),
			[interpolatorReady, slotsMap, visibilityBlocked],
		);
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

		return { key: currentScreenKey, value, children: content };
	},
);

const styles = StyleSheet.create({ container: { flex: 1 } });
