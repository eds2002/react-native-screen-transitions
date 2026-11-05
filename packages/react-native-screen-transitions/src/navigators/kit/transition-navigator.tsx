import type { ReactNode } from "react";
import { ScreenHostStoreProvider } from "../../providers/host/screen-host.provider";
import { TransitionScenes } from "./components/scenes";
import { NavigatorStoreProvider } from "./state/navigator-store";
import type { TransitionNavigator as TransitionNavigatorValue } from "./types";
import { getNavigatorInternals } from "./use-transition-navigator";

export interface TransitionNavigatorViewProps {
	value: TransitionNavigatorValue;
	/**
	 * What to draw. Defaults to `<TransitionNavigator.Scenes />`, the standard stacked layers. Wrap
	 * that in your own shell, or replace it, to present the scenes differently.
	 */
	children?: ReactNode;
}

/**
 * Hosts a navigator built with `useTransitionNavigator`: every scene inside sees its neighbours, its
 * gestures and its place in the navigator, as screens in Blank Stack do.
 */
function TransitionNavigatorView({
	value,
	children,
}: TransitionNavigatorViewProps) {
	const { store, host } = getNavigatorInternals(value);
	return (
		<NavigatorStoreProvider value={store}>
			<ScreenHostStoreProvider value={host}>
				{children ?? <TransitionScenes />}
			</ScreenHostStoreProvider>
		</NavigatorStoreProvider>
	);
}

export const TransitionNavigator = Object.assign(TransitionNavigatorView, {
	/** Draws every scene with the standard layers and the navigator's overlay. */
	Scenes: TransitionScenes,
});
