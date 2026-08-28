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
			<ScreenTopologyProvider>
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
			</ScreenTopologyProvider>
		</DescriptorsProvider>
	);
}
