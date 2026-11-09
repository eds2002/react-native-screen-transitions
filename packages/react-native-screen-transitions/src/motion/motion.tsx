import { memo, type ReactNode, useMemo, useState } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { ScreenMotion } from "../components/screen-motion";
import { BuilderProvider } from "../providers/builder";
import { useMotionLifecycle } from "../providers/motion/lifecycle/use-motion-lifecycle";
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
	useMotionLifecycle({
		mode: initial === "closed" ? "closed" : "mount",
		onOpen,
		onClose,
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
			<ScreenMotion
				values={values}
				onDismissRequest={requestClose}
				pointerEvents={interactive ? "box-none" : "none"}
				lifecycle={
					<MotionLifecycle
						initial={initial}
						onOpen={options.onOpen}
						onClose={options.onClose}
					/>
				}
			>
				{children}
			</ScreenMotion>
		</BuilderProvider>
	);
}
