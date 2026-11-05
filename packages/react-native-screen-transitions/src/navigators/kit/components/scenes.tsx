import { memo, type ReactNode, useMemo } from "react";
import { PortalProvider } from "../../../components/boundary/portal";
import { Overlay } from "../../../components/overlay";
import { ScreenLayers } from "../../../components/screen-layers";
import { BuilderProvider } from "../../../providers/builder";
import { MotionProvider } from "../../../providers/motion";
import { OrchestratorProvider } from "../../../providers/orchestrator";
import { useNavigationHelpers } from "../hooks/use-navigation-helpers";
import { useNavigatorStore } from "../state/navigator-store";
import { ActivityContainer, ActivityScreen } from "./activity";
import { SceneLifecycle } from "./lifecycle/scene-lifecycle";

const SceneMotion = memo(function SceneMotion({
	children,
}: {
	children: ReactNode;
}) {
	const { requestDismiss } = useNavigationHelpers();
	return (
		<MotionProvider onDismissRequest={requestDismiss}>
			<OrchestratorProvider>
				<ScreenLayers onDismissRequest={requestDismiss}>
					{children}
				</ScreenLayers>
			</OrchestratorProvider>
			<SceneLifecycle />
		</MotionProvider>
	);
});

interface RouteKeyProps {
	routeKey: string;
}

const SceneRow = memo(function SceneRow({ routeKey }: RouteKeyProps) {
	const scene = useNavigatorStore((store) => store.scenesByKey[routeKey]);
	const descriptors = useMemo(
		() =>
			scene && {
				current: scene.descriptor,
				previous: scene.previousDescriptor,
				next: scene.nextDescriptor,
				closingNext: scene.closingNextDescriptor,
			},
		// Scenes are reused while none of their descriptors change.
		[scene],
	);

	// A row can re-render from a store snapshot that no longer has its route (it was just removed)
	// before the list above it re-renders and drops the row: render nothing until then.
	if (!scene || !descriptors) {
		return null;
	}

	return (
		<ActivityScreen routeKey={routeKey}>
			<BuilderProvider routeKey={routeKey} descriptors={descriptors}>
				<SceneMotion>{scene.descriptor.render?.()}</SceneMotion>
			</BuilderProvider>
		</ActivityScreen>
	);
});

/**
 * Draws every scene of the surrounding `TransitionNavigator` with the standard layers (backdrop,
 * surface, content), each with its own motion, plus the navigator's overlay. Closing scenes stay
 * until their close animation finishes.
 */
export const TransitionScenes = memo(function TransitionScenes() {
	const routeKeys = useNavigatorStore((store) => store?.routeKeys);
	return (
		<PortalProvider>
			<Overlay />
			<ActivityContainer>
				{routeKeys.map((routeKey) => (
					<SceneRow key={routeKey} routeKey={routeKey} />
				))}
			</ActivityContainer>
		</PortalProvider>
	);
});
