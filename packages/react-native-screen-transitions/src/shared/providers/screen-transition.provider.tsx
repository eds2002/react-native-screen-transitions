import type React from "react";
import type { ComponentType } from "react";
import { RootTransitionAware } from "../components/root-transition-aware";
import type { Any } from "../types/utils.types";
import { ScreenGestureProvider } from "./gestures.provider";
import { type BaseDescriptor, KeysProvider } from "./keys.provider";
import { TransitionStylesProvider } from "./transition-styles.provider";

type Props<TDescriptor extends BaseDescriptor> = {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
	children: React.ReactNode;
	LifecycleController: ComponentType<Any>;
	/** Optional custom dismiss handler for non-React-Navigation stacks */
	onGestureDismiss?: () => void;
};

export function ScreenTransitionProvider<TDescriptor extends BaseDescriptor>({
	previous,
	current,
	next,
	children,
	LifecycleController,
	onGestureDismiss,
}: Props<TDescriptor>) {
	return (
		<KeysProvider<TDescriptor>
			previous={previous}
			current={current}
			next={next}
		>
			<ScreenGestureProvider onGestureDismiss={onGestureDismiss}>
				<LifecycleController>
					<TransitionStylesProvider>
						<RootTransitionAware>{children}</RootTransitionAware>
					</TransitionStylesProvider>
				</LifecycleController>
			</ScreenGestureProvider>
		</KeysProvider>
	);
}
