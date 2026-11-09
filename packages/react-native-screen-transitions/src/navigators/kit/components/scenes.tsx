import { memo, type ReactNode, useEffect, useMemo, useRef } from "react";
import { PortalProvider } from "../../../components/boundary/portal";
import { Overlay } from "../../../components/overlay";
import { ScreenMotion } from "../../../components/screen-motion";
import { BuilderProvider } from "../../../providers/builder";
import { resetStoresForScreen } from "../../../providers/motion/lifecycle/reset-stores-for-screen";
import { useNavigationHelpers } from "../hooks/use-navigation-helpers";
import { useNavigatorStore } from "../state/navigator-store";
import { ActivityContainer, ActivityScreen } from "./activity";
import { SceneLifecycle } from "./lifecycle/scene-lifecycle";

/**
 * Clears what a route leaves in the shared stores once it is gone from the navigator. A closing
 * route clears as its close completes; a route removed without closing (the screens between two
 * others, dropped at once by popToTop) never does, and its bounds would stay paired with the screen
 * below, styling it from a pair that no longer moves. A route still listed (an inactive screen
 * unmounted to save memory) keeps its state. Clearing twice is harmless.
 */
function useResetRemovedRoutes(routeKeys: readonly string[]) {
	const previous = useRef(routeKeys);
	useEffect(() => {
		const before = previous.current;
		previous.current = routeKeys;
		if (before === routeKeys) return;
		for (const key of before) {
			if (!routeKeys.includes(key)) resetStoresForScreen(key);
		}
	}, [routeKeys]);
}

const SceneMotion = memo(function SceneMotion({
	children,
}: {
	children: ReactNode;
}) {
	const { requestDismiss } = useNavigationHelpers();
	return (
		<ScreenMotion
			onDismissRequest={requestDismiss}
			lifecycle={<SceneLifecycle />}
		>
			{children}
		</ScreenMotion>
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
	useResetRemovedRoutes(routeKeys);
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
