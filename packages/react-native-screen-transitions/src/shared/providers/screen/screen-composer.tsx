import type React from "react";
import type { ComponentType } from "react";
import { RootTransitionAware } from "../../components/root-transition-aware";
import type { Any } from "../../types/utils.types";
import { ScreenGestureProvider } from "../gestures.provider";
import { type BaseDescriptor, KeysProvider } from "./keys.provider";
import { ScreenStylesProvider } from "./styles.provider";

type Props<TDescriptor extends BaseDescriptor> = {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
	children: React.ReactNode;
	LifecycleController: ComponentType<Any>;
};

export function ScreenComposer<TDescriptor extends BaseDescriptor>({
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
					<ScreenStylesProvider>
						<RootTransitionAware>{children}</RootTransitionAware>
					</ScreenStylesProvider>
				</LifecycleController>
			</ScreenGestureProvider>
		</KeysProvider>
	);
}
