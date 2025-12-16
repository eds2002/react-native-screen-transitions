import type React from "react";
import type { ComponentType } from "react";
import { ScreenTransitionProvider } from "../../shared/providers/screen-transition.provider";
import type { Any } from "../../shared/types/utils.types";
import type { ComponentStackDescriptor } from "../types";
import { useComponentNavigationContext } from "../utils/with-component-navigation";

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
	const { navigation } = useComponentNavigationContext();

	const handleGestureDismiss = () => {
		if (navigation.canGoBack()) {
			navigation.pop();
		}
	};

	return (
		<ScreenTransitionProvider
			previous={previous}
			current={current}
			next={next}
			LifecycleController={LifecycleController}
			onGestureDismiss={handleGestureDismiss}
		>
			{children}
		</ScreenTransitionProvider>
	);
}
