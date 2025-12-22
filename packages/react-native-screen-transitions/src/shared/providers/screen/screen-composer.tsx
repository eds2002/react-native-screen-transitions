import type React from "react";
import { RootTransitionAware } from "../../components/root-transition-aware";
import { ScreenLifecycle } from "../../components/screen-lifecycle";
import { ScreenGestureProvider } from "../gestures.provider";
import { type BaseDescriptor, KeysProvider } from "./keys.provider";
import { ScreenStylesProvider } from "./styles.provider";

type Props<TDescriptor extends BaseDescriptor> = {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
	children: React.ReactNode;
};

export function ScreenComposer<TDescriptor extends BaseDescriptor>({
	previous,
	current,
	next,
	children,
}: Props<TDescriptor>) {
	return (
		<KeysProvider<TDescriptor>
			previous={previous}
			current={current}
			next={next}
		>
			<ScreenGestureProvider>
				<ScreenLifecycle>
					<ScreenStylesProvider>
						<RootTransitionAware>{children}</RootTransitionAware>
					</ScreenStylesProvider>
				</ScreenLifecycle>
			</ScreenGestureProvider>
		</KeysProvider>
	);
}
