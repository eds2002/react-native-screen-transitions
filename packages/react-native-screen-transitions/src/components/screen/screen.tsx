import { type ComponentType, memo, type ReactNode, useMemo } from "react";
import { useNavigationHelpers } from "../../hooks/navigation/use-navigation-helpers";
import { BuilderProvider } from "../../providers/screen/builder";
import { MotionProvider } from "../../providers/screen/motion";
import { OrchestratorProvider } from "../../providers/screen/orchestrator";
import { useBlankStackStore } from "../../providers/stack/blank-stack.provider";
import { ScreenContainer } from "./container";

const SceneMotion = ({
	children,
	lifecycle: Lifecycle,
}: {
	children: ReactNode;
	lifecycle: ComponentType;
}) => {
	const { requestDismiss } = useNavigationHelpers();
	return (
		<MotionProvider onDismissRequest={requestDismiss}>
			<OrchestratorProvider>
				<ScreenContainer onDismissRequest={requestDismiss}>
					{children}
				</ScreenContainer>
			</OrchestratorProvider>
			<Lifecycle />
		</MotionProvider>
	);
};

export const Screen = memo(function Screen({
	routeKey,
	children,
	lifecycle,
}: {
	routeKey: string;
	children: ReactNode;
	lifecycle: ComponentType;
}) {
	const scene = useBlankStackStore((store) => store.scenesByKey[routeKey]);
	const descriptors = useMemo(
		() => ({
			current: scene.descriptor,
			previous: scene.previousDescriptor,
			next: scene.nextDescriptor,
		}),
		[scene.descriptor, scene.previousDescriptor, scene.nextDescriptor],
	);
	return (
		<BuilderProvider routeKey={routeKey} descriptors={descriptors}>
			<SceneMotion lifecycle={lifecycle}>{children}</SceneMotion>
		</BuilderProvider>
	);
});
