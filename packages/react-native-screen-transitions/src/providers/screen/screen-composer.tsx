import type React from "react";
import { ScreenContainer } from "../../components/screen-container";
import { ScreenLifecycle } from "../../components/screen-lifecycle";
import { BuilderProvider } from "./builder";
import { MotionProvider } from "./motion";
import { OrchestratorProvider } from "./orchestrator";

type Props = {
	routeKey: string;
	children: React.ReactNode;
};

export function ScreenComposer({ routeKey, children }: Props) {
	return (
		<BuilderProvider routeKey={routeKey}>
			<ScreenLifecycle>
				<MotionProvider>
					<OrchestratorProvider>
						<ScreenContainer>{children}</ScreenContainer>
					</OrchestratorProvider>
				</MotionProvider>
			</ScreenLifecycle>
		</BuilderProvider>
	);
}
