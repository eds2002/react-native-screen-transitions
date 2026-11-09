import { memo, type ReactNode, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { ScreenLayers } from "../components/screen-layers";
import useStableCallback from "../hooks/use-stable-callback";
import { BuilderProvider, useBuilderStore } from "../providers/builder";
import { MotionProvider } from "../providers/motion";
import { resetStoresForScreen } from "../providers/motion/lifecycle/reset-stores-for-screen";
import { useCloseCompletion } from "../providers/motion/lifecycle/use-close-completion";
import { useOpenTransitionIntent } from "../providers/motion/lifecycle/use-open-transition-intent";
import { useTransitionStartController } from "../providers/motion/lifecycle/use-transition-start-controller";
import { useMotionStore } from "../providers/motion/motion.store";
import { OrchestratorProvider } from "../providers/orchestrator";
import { useNextDescriptor, useRegisterAbove } from "./relations";
import type { Motion, MotionOptions } from "./types";
import { createStandaloneDescriptor, getMotionInternals } from "./use-motion";

/** Opens on mount (or stays closed), starts requested transitions, reports completions. */
const MotionLifecycle = memo(function MotionLifecycle({
	initial,
	onOpen,
	onClose,
}: {
	initial: NonNullable<MotionOptions["initial"]>;
	onOpen?: () => void;
	onClose?: () => void;
}) {
	const current = useBuilderStore((store) => store.descriptors.current);
	const state = useMotionStore((store) => store.state);
	const handleOpen = useStableCallback(() => onOpen?.());
	const handleClose = useStableCallback(() => {
		resetStoresForScreen(current.route.key);
		onClose?.();
	});

	useOpenTransitionIntent(
		current,
		state,
		state,
		handleOpen,
		initial === "closed" ? "closed" : "mount",
	);
	useTransitionStartController({ current, animations: state, system: state });
	useCloseCompletion({
		closing: state.closing,
		animationProgress: state.animationProgress,
		onComplete: handleClose,
	});

	return null;
});

export type MotionViewProps = {
	/** The unit to render, from `useMotion()`. */
	value: Motion;
	children: ReactNode;
};

/**
 * Renders a motion unit: its content, backdrop and gestures, animated by its interpolator.
 * Inside it, `useScreenAnimation()`, `Transition.View` slots and `Transition.Boundary` work as
 * they do in a screen. It fills its parent.
 *
 * Not memoized: the handle keeps its identity while its options change.
 */
export function MotionView({ value, children }: MotionViewProps) {
	const { values, options, requestClose } = getMotionInternals(value);
	// Closed or closing, the unit lets touches through to what's behind it, as a navigator's
	// closing screens do.
	const [interactive, setInteractive] = useState(options.initial === "open");
	useAnimatedReaction(
		() => {
			const status = value.status.get();
			return status === "open" || status === "opening";
		},
		(next, previous) => {
			if (next !== previous) scheduleOnRN(setInteractive, next);
		},
	);
	const initial = options.initial ?? "closed";
	const current = useMemo(
		() => createStandaloneDescriptor(value.key, options),
		[value.key, options],
	);
	// Neighbours, as a stack gives them: the unit this one opens over, and the one over it now.
	const below = options.previous;
	const belowOptions = below ? getMotionInternals(below).options : undefined;
	const previous = useMemo(
		() =>
			below && belowOptions
				? createStandaloneDescriptor(below.key, belowOptions)
				: undefined,
		[below, belowOptions],
	);
	const next = useNextDescriptor(value.key);
	useRegisterAbove(below?.key, current);
	const descriptors = useMemo(
		() => ({ current, previous, next }),
		[current, previous, next],
	);

	return (
		<BuilderProvider
			routeKey={value.key}
			descriptors={descriptors}
			startsSettled={initial === "open"}
		>
			<MotionProvider values={values} onDismissRequest={requestClose}>
				<View
					style={styles.fill}
					pointerEvents={interactive ? "box-none" : "none"}
				>
					<OrchestratorProvider>
						<ScreenLayers onDismissRequest={requestClose}>
							{children}
						</ScreenLayers>
					</OrchestratorProvider>
				</View>
				<MotionLifecycle
					initial={initial}
					onOpen={options.onOpen}
					onClose={options.onClose}
				/>
			</MotionProvider>
		</BuilderProvider>
	);
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
