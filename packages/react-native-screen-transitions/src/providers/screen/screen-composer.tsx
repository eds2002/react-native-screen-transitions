import { ScreenContainer } from "../../components/screen-container";
import { BuilderProvider, type BuilderProviderProps } from "./builder";
import { MotionProvider } from "./motion";
import { OrchestratorProvider } from "./orchestrator";

export type ScreenComposerProps = BuilderProviderProps & {
	onDismissRequest?: () => void;
};

export function ScreenComposer({
	children,
	onDismissRequest,
	...builderProps
}: ScreenComposerProps) {
	return (
		<BuilderProvider {...builderProps}>
			<MotionProvider onDismissRequest={onDismissRequest}>
				<OrchestratorProvider>
					<ScreenContainer onDismissRequest={onDismissRequest}>
						{children}
					</ScreenContainer>
				</OrchestratorProvider>
			</MotionProvider>
		</BuilderProvider>
	);
}
