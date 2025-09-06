import type React from "react";
import { ScreenGestureProvider } from "../providers/gestures";
import { KeysProvider } from "../providers/keys";
import { TransitionStylesProvider } from "../providers/transition-styles";
import type { NativeStackDescriptor } from "../types/navigator";
import { ScreenLifecycleController } from "./controllers/screen-lifecycle";
import { RootTransitionAware } from "./root-transition-aware";

type Props = {
	previous?: NativeStackDescriptor;
	current: NativeStackDescriptor;
	next?: NativeStackDescriptor;
	children: React.ReactNode;
};

export function ScreenTransitionTree({
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
