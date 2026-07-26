import type React from "react";
import { ScreenContainer } from "../../components/screen-container";
import { ScreenLifecycle } from "../../components/screen-lifecycle";
import { ScreenAnimationProvider } from "./animation";
import { type BaseDescriptor, DescriptorsProvider } from "./descriptors";
import { ScreenGestureProvider } from "./gestures";
import { ScreenOptionsProvider } from "./options";
import { ScreenSlotProvider } from "./styles";

type Props<TDescriptor extends BaseDescriptor> = {
	previous?: TDescriptor;
	current?: TDescriptor;
	next?: TDescriptor;
	routeKey?: string;
	children: React.ReactNode;
};

export function ScreenComposer<TDescriptor extends BaseDescriptor>({
	previous,
	current,
	next,
	routeKey,
	children,
}: Props<TDescriptor>) {
	return (
		<DescriptorsProvider
			previous={previous}
			current={current}
			next={next}
			routeKey={routeKey}
		>
			<ScreenLifecycle>
				<ScreenOptionsProvider>
					<ScreenGestureProvider>
						<ScreenAnimationProvider>
							<ScreenSlotProvider>
								<ScreenContainer>{children}</ScreenContainer>
							</ScreenSlotProvider>
						</ScreenAnimationProvider>
					</ScreenGestureProvider>
				</ScreenOptionsProvider>
			</ScreenLifecycle>
		</DescriptorsProvider>
	);
}
