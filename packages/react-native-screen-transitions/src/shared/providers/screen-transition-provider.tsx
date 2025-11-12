import type React from "react";
import { ScreenLifecycleController } from "../components/controllers/screen-lifecycle";
import { RootTransitionAware } from "../components/root-transition-aware";
import { ScreenGestureProvider } from "../providers/gestures";
import { KeysProvider, type TransitionDescriptor } from "../providers/keys";
import { TransitionStylesProvider } from "../providers/transition-styles";

type Props<TDescriptor extends TransitionDescriptor> = {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
	children: React.ReactNode;
};

export function ScreenTransitionProvider<TDescriptor extends TransitionDescriptor>(
{
	previous,
	current,
	next,
	children,
}: Props<TDescriptor>,
) {
	return (
		<KeysProvider<TDescriptor>
			previous={previous}
			current={current}
			next={next}
		>
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
