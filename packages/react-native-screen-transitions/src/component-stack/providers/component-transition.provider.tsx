import type React from "react";
import type { ComponentType } from "react";
import { RootTransitionAware } from "../../shared/components/root-transition-aware";
import { KeysProvider } from "../../shared/providers/keys.provider";
import { TransitionStylesProvider } from "../../shared/providers/transition-styles.provider";
import type { Any } from "../../shared/types/utils.types";
import type { ComponentStackDescriptor } from "../types";
import { ComponentGestureProvider } from "./component-gesture.provider";

type Props = {
	previous?: ComponentStackDescriptor;
	current: ComponentStackDescriptor;
	next?: ComponentStackDescriptor;
	children: React.ReactNode;
	LifecycleController: ComponentType<Any>;
};

export function ComponentTransitionProvider({
	previous,
	current,
	next,
	children,
	LifecycleController,
}: Props) {
	return (
		<KeysProvider
			previous={previous as any}
			current={current as any}
			next={next as any}
		>
			<ComponentGestureProvider>
				<LifecycleController>
					<TransitionStylesProvider>
						<RootTransitionAware>{children}</RootTransitionAware>
					</TransitionStylesProvider>
				</LifecycleController>
			</ComponentGestureProvider>
		</KeysProvider>
	);
}
