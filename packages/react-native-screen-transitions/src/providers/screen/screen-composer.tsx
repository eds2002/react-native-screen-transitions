import type React from "react";
import { ScreenContainer } from "../../components/screen-container";
import { ScreenLifecycle } from "../../components/screen-lifecycle";
import { ScreenAnimationProvider } from "./animation";
import { DescriptorsProvider } from "./descriptors";
import { ScreenGestureProvider } from "./gestures";
import { ScreenOptionsProvider } from "./options";
import { ScreenSlotProvider } from "./styles";
import { ScreenTopologyProvider } from "./topology";

type Props = {
	routeKey: string;
	children: React.ReactNode;
};

export function ScreenComposer({ routeKey, children }: Props) {
	return (
		<DescriptorsProvider routeKey={routeKey}>
			<ScreenLifecycle>
				<ScreenOptionsProvider>
					<ScreenGestureProvider>
						<ScreenAnimationProvider>
							<ScreenTopologyProvider>
								<ScreenSlotProvider>
									<ScreenContainer>{children}</ScreenContainer>
								</ScreenSlotProvider>
							</ScreenTopologyProvider>
						</ScreenAnimationProvider>
					</ScreenGestureProvider>
				</ScreenOptionsProvider>
			</ScreenLifecycle>
		</DescriptorsProvider>
	);
}
