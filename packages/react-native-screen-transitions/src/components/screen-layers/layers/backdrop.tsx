import { memo, useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { useBuilderStore } from "../../../providers/builder";
import { animateToProgress } from "../../../providers/motion/animation/animate-to-progress";
import { resolveAutoSnapPoint } from "../../../providers/motion/gestures/shared/snap-points";
import { useMotionStore } from "../../../providers/motion/motion.store";
import {
	useSlotProps,
	useSlotStyles,
} from "../../../providers/orchestrator/styles";
import type {
	BackdropBehavior,
	ScreenBackdropComponentProps,
} from "../../../types/screen.types";
import { resolveSnapTransitionSpec } from "../../../utils/animation/resolve-snap-transition-spec";
import { findCollapseTarget } from "../helpers/find-collapse-target";
import { LayerComponent } from "../helpers/layer-component";

export const BackdropLayer = memo(function BackdropLayer({
	backdropBehavior,
	isBackdropActive,
	onDismissRequest,
}: {
	backdropBehavior: BackdropBehavior;
	isBackdropActive: boolean;
	onDismissRequest?: () => void;
}) {
	const BackdropComponent = useBuilderStore(
		(store) => store.options.backdropComponent,
	);
	const rawSnapPoints = useBuilderStore((store) => store.options.snapPoints);
	const isGestureDismissEnabled = useBuilderStore(
		(store) => store.options.gestureEnabled !== false,
	);
	const canDismiss = isGestureDismissEnabled;
	const transitionSpec = useBuilderStore(
		(store) => store.options.transitionSpec,
	);
	const values = useMotionStore((store) => store.state);

	const handleBackdropPress = useCallback(() => {
		if (backdropBehavior === "dismiss") {
			onDismissRequest?.();
			return;
		}

		if (backdropBehavior === "collapse") {
			// No snap points → fallback to dismiss
			if (!rawSnapPoints || rawSnapPoints.length === 0) {
				onDismissRequest?.();
				return;
			}

			scheduleOnUI(() => {
				"worklet";
				const resolvedSnaps: number[] = [];

				for (let i = 0; i < rawSnapPoints.length; i++) {
					const point = rawSnapPoints[i];
					// Unmeasured, 'auto' isn't a snap point yet (it reads -1).
					const resolvedPoint =
						typeof point === "string"
							? resolveAutoSnapPoint(true, values.resolvedAutoSnapPoint.get())
							: point;

					if (typeof resolvedPoint === "number") {
						resolvedSnaps.push(resolvedPoint);
					}
				}

				const { target, shouldDismiss } = findCollapseTarget(
					values.transitionProgress.get(),
					resolvedSnaps,
					canDismiss,
				);

				// If already dismissing, skip
				if (values.dismissing.get()) return;

				values.dismissing.set(shouldDismiss ? 1 : 0);

				const spec = shouldDismiss
					? transitionSpec
					: resolveSnapTransitionSpec(transitionSpec, "collapse");

				animateToProgress({
					target,
					markEntering: false,
					spec,
					values,
				});

				if (shouldDismiss) {
					if (onDismissRequest) scheduleOnRN(onDismissRequest);
				}
			});
		}
	}, [
		values,
		backdropBehavior,
		rawSnapPoints,
		canDismiss,
		transitionSpec,
		onDismissRequest,
	]);

	const animatedBackdropStyle = useSlotStyles("backdrop");
	const animatedBackdropProps = useSlotProps("backdrop");
	const backdropPointerEvents = isBackdropActive ? "auto" : "none";
	const backdropStyles = [
		StyleSheet.absoluteFill,
		animatedBackdropStyle,
	] as ScreenBackdropComponentProps["styles"];
	const backdropProps =
		animatedBackdropProps as ScreenBackdropComponentProps["props"];

	return (
		<Pressable
			style={StyleSheet.absoluteFill}
			pointerEvents={backdropBehavior === "passthrough" ? "none" : "auto"}
			onPress={isBackdropActive ? handleBackdropPress : undefined}
		>
			<LayerComponent
				component={BackdropComponent}
				styles={backdropStyles}
				props={BackdropComponent ? backdropProps : undefined}
				pointerEvents={backdropPointerEvents}
			/>
		</Pressable>
	);
});
