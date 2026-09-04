import { type ReactNode, useMemo, useRef, useSyncExternalStore } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { AnimationStore } from "../../../stores/animation.store";
import { GestureStore } from "../../../stores/gesture.store";
import { SystemStore } from "../../../stores/system.store";
import type { SnapPoint } from "../../../types/screen.types";
import createProvider from "../../../utils/create-provider";
import { useBlankStackStore } from "../blank-stack.provider";
import {
	createStackTransitionController,
	resolveStackTransitionDismissalBoundary,
	resolveStackTransitionDriverSignal,
	type StackTransitionController,
	StackTransitionDriverSignal,
	type StackTransitionSelection,
} from "./stack-transition-controller";

type StackTransitionProviderProps = {
	children: ReactNode;
};

type StackTransitionStoreValue = {
	selection: StackTransitionSelection | null;
};

const useDriverSignal = ({
	controller,
	driverRouteKey,
	snapPoints,
}: {
	controller: StackTransitionController;
	driverRouteKey: string | undefined;
	snapPoints: SnapPoint[] | undefined;
}) => {
	const driver = useMemo(() => {
		if (!driverRouteKey) return null;

		return {
			animations: AnimationStore.getBag(driverRouteKey),
			gestures: GestureStore.getBag(driverRouteKey),
			system: SystemStore.getBag(driverRouteKey),
		};
	}, [driverRouteKey]);

	useAnimatedReaction(
		() => {
			if (!driver) return StackTransitionDriverSignal.Idle;
			const progressBaseline = driver.gestures.internal.progressBaseline.get();

			return resolveStackTransitionDriverSignal({
				closing: driver.animations.closing.get(),
				dismissalBoundary: resolveStackTransitionDismissalBoundary({
					progressBaseline,
					resolvedAutoSnapPoint: driver.system.resolvedAutoSnapPoint.get(),
					snapPoints,
				}),
				dismissing: driver.gestures.dismissing.get(),
				dragging: driver.gestures.dragging.get(),
				entering: driver.animations.entering.get(),
				progressBaseline,
				progressSettled: driver.animations.progressSettled.get(),
				settling: driver.gestures.settling.get(),
				targetProgress: driver.system.targetProgress.get(),
				visualProgress: driver.animations.visualProgress.get(),
			});
		},
		(signal, previousSignal) => {
			if (signal === previousSignal) return;

			scheduleOnRN(controller.handleDriverSignal, signal);
		},
		[controller, driver, snapPoints],
	);
};

export const { StackTransitionProvider, useStackTransitionStore } =
	createProvider("StackTransition")<
		StackTransitionProviderProps,
		StackTransitionStoreValue
	>(({ children }) => {
		const focusedIndex = useBlankStackStore((store) => store.focusedIndex);
		const scenes = useBlankStackStore((store) => store.scenes);
		const controllerRef = useRef<StackTransitionController | null>(null);

		if (!controllerRef.current) {
			controllerRef.current = createStackTransitionController({
				focusedIndex,
				scenes,
			});
		}

		const controller = controllerRef.current;
		controller.update({ focusedIndex, scenes });

		const snapshot = useSyncExternalStore(
			controller.subscribe,
			controller.getSnapshot,
			controller.getSnapshot,
		);
		const focusedRouteKey = scenes[focusedIndex]?.route.key;
		const driverRouteKey =
			snapshot.selection?.driverRouteKey ?? focusedRouteKey;
		const driverSnapPoints = scenes.find(
			(scene) => scene.route.key === driverRouteKey,
		)?.descriptor.options.snapPoints;

		useDriverSignal({
			controller,
			driverRouteKey,
			snapPoints: driverSnapPoints,
		});

		return {
			children,
			value: {
				selection: snapshot.selection,
			},
		};
	});
