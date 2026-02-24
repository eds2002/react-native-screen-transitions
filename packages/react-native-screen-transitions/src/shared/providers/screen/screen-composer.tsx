import type React from "react";
import { ScreenContainer } from "../../components/screen-container";
import { ScreenLifecycle } from "../../components/screen-lifecycle";
import { ScreenGestureProvider } from "../gestures.provider";
import { ScreenAnimationProvider } from "./animation.provider";
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
		<KeysProvider previous={previous} current={current} next={next}>
			<ScreenLifecycle>
				<ScreenGestureProvider>
					<ScreenAnimationProvider>
						<ScreenStylesProvider>
							<ScreenContainer>{children}</ScreenContainer>
						</ScreenStylesProvider>
					</ScreenAnimationProvider>
				</ScreenGestureProvider>
			</ScreenLifecycle>
		</KeysProvider>
	);
}
