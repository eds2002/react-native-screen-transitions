import type React from "react";
import { RootTransitionAware } from "../components/root-transition-aware";
import type { ScreenLifecycleProps } from "../components/controllers/screen-lifecycle";
import { ScreenGestureProvider } from "../providers/gestures";
import { KeysProvider, type TransitionDescriptor } from "../providers/keys";
import { TransitionStylesProvider } from "../providers/transition-styles";
import { ComponentType, ReactNode } from "react";

type Props<TDescriptor extends TransitionDescriptor> = {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
	children: React.ReactNode;
  LifecycleController: ComponentType<ScreenLifecycleProps>
};

export function ScreenTransitionProvider<TDescriptor extends TransitionDescriptor>(
{
	previous,
	current,
	next,
	children,
	LifecycleController,
}: Props<TDescriptor>,
) {
	return (
		<KeysProvider<TDescriptor>
			previous={previous}
			current={current}
			next={next}
		>
			<ScreenGestureProvider>
				<LifecycleController>
					<TransitionStylesProvider>
						<RootTransitionAware>{children}</RootTransitionAware>
					</TransitionStylesProvider>
				</LifecycleController>
			</ScreenGestureProvider>
		</KeysProvider>
	);
}
