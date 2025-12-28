import type React from "react";
import { useMemo } from "react";
import { RootTransitionAware } from "../../components/root-transition-aware";
import { ScreenLifecycle } from "../../components/screen-lifecycle";
import { HistoryStore } from "../../stores/history.store";
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
	// Add to history during render (before ScreenLifecycle renders)
	useMemo(() => {
		const navigatorKey = current.navigation.getState().key;
		HistoryStore.add(current, navigatorKey);
	}, [current]);

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
