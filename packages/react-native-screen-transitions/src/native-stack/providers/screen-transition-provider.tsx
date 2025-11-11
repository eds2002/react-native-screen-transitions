import type React from "react";
import { ScreenLifecycleController } from "../components/controllers/screen-lifecycle";
import { RootTransitionAware } from "../components/root-transition-aware";
import { ScreenGestureProvider } from "../providers/gestures";
import { KeysProvider } from "../providers/keys";
import { TransitionStylesProvider } from "../providers/transition-styles";
import type { NativeStackDescriptor } from "../types/navigator";

type Props = {
	previous?: NativeStackDescriptor;
	current: NativeStackDescriptor;
	next?: NativeStackDescriptor;
	children: React.ReactNode;
};

export function ScreenTransitionProvider({
	previous,
	current,
	next,
	children,
}: Props) {
	return (
		<KeysProvider previous={previous} current={current} next={next}>
			<ScreenGestureProvider>
				<ScreenLifecycleController>
					<TransitionStylesProvider>
						<RootTransitionAware>{children}</RootTransitionAware>
					</TransitionStylesProvider>
				</ScreenLifecycleController>
			</ScreenGestureProvider>
		</KeysProvider>
	);
}
