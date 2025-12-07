import type React from "react";
import type { ComponentType } from "react";
import { RootTransitionAware } from "../components/root-transition-aware";
import type { Any } from "../types/utils.types";
import { ScreenGestureProvider } from "./gestures.provider";
import { KeysProvider, type TransitionDescriptor } from "./keys.provider";
import { TransitionStylesProvider } from "./transition-styles.provider";

type Props<TDescriptor extends TransitionDescriptor> = {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
	children: React.ReactNode;
	LifecycleController: ComponentType<Any>;
};

export function ScreenTransitionProvider<
	TDescriptor extends TransitionDescriptor,
>({
	previous,
	current,
	next,
	children,
	LifecycleController,
}: Props<TDescriptor>) {
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
