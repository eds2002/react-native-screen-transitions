import { type ReactNode, useMemo } from "react";
import type { BaseStackScene } from "../../types/stack.types";
import createProvider from "../../utils/create-provider";

/**
 * What the transition engine knows about the screens around it.
 *
 * A host (Blank Stack, the native-stack adapter, or any custom navigator)
 * supplies this. The engine reads it instead of a navigator's own store or
 * React Navigation state, and works without it: outside a host, a screen
 * stands alone (not closing, not part of a stack, never the first route).
 */
export interface ScreenHostValue {
	/** Identifies the navigator that owns these screens. */
	navigatorKey: string;
	/** Mounted screens from bottom to top, including screens still closing. */
	routeKeys: readonly string[];
	scenes: readonly BaseStackScene[];
	scenesByKey: Readonly<Record<string, BaseStackScene>>;
	/** Index in `scenes` of the presented screen. */
	focusedIndex: number;
	/** The navigator's first route. Gestures can't dismiss it. */
	firstRouteKey: string | undefined;
}

const { StoreProvider: ScreenHostStoreProvider, useOptionalScreenHostStore } =
	createProvider("ScreenHost")<
		{ value: ScreenHostValue; children: ReactNode },
		ScreenHostValue
	>(({ value, children }) => ({ value, children }));

/**
 * The route keys of a screen's stack, bottom to top (closing screens included); outside a host, the
 * screen alone.
 */
const useStackScreenKeys = (screenKey: string): string[] => {
	const scenes = useOptionalScreenHostStore((store) => store?.scenes);
	return useMemo(
		() => scenes?.map((scene) => scene.route.key) ?? [screenKey],
		[scenes, screenKey],
	);
};

export {
	ScreenHostStoreProvider,
	useOptionalScreenHostStore,
	useStackScreenKeys,
};
