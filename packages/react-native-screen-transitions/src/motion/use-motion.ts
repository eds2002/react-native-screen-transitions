import { useId, useMemo, useRef } from "react";
import { useDerivedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import { EPSILON } from "../constants";
import { snapDescriptorToIndex } from "../controls/snap-to";
import { useMotionValues } from "../providers/motion/hooks/use-motion-values";
import { LifecycleTransitionRequestKind } from "../providers/motion/hooks/use-transition-values";
import { getInitialProgress } from "../providers/motion/lifecycle/use-open-transition-intent";
import type { BaseStackDescriptor } from "../types/stack.types";
import type {
	Motion,
	MotionInternals,
	MotionOptions,
	MotionStatus,
} from "./types";

const internals = new WeakMap<Motion, MotionInternals>();

export function getMotionInternals(motion: Motion): MotionInternals {
	const found = internals.get(motion);
	if (!found) {
		throw new Error("Transition.Motion needs a `value` created by useMotion()");
	}
	return found;
}

/** A unit has no navigator. The engine never reads this; the descriptor type requires one. */
const STANDALONE_NAVIGATION: BaseStackDescriptor["navigation"] = {
	getState: () => ({ key: "", index: 0, routes: [] }),
	dispatch: () => {},
};

/** The unit as a descriptor. Only screen options reach the engine (and its worklets). */
export function createStandaloneDescriptor(
	key: string,
	options: MotionOptions,
): BaseStackDescriptor {
	const {
		initial: _initial,
		onRequestClose: _onRequestClose,
		onOpen: _onOpen,
		onClose: _onClose,
		previous: _previous,
		...config
	} = options;
	return {
		route: { key, name: key },
		navigation: STANDALONE_NAVIGATION,
		options: config,
	};
}

const shallowEqual = (
	a: object,
	b: object,
	field: (x: unknown, y: unknown) => boolean = Object.is,
) => {
	const aKeys = Object.keys(a) as (keyof typeof a)[];
	return (
		aKeys.length === Object.keys(b).length &&
		aKeys.every((key) => field(a[key], b[key]))
	);
};

/** One option field: an inline array or object (`snapPoints: [0.5, 1]`) compares by its items. */
const sameField = (x: unknown, y: unknown) => {
	if (Object.is(x, y)) return true;
	if (Array.isArray(x) && Array.isArray(y)) {
		return x.length === y.length && x.every((item, i) => Object.is(item, y[i]));
	}
	if (
		x !== null &&
		y !== null &&
		typeof x === "object" &&
		typeof y === "object" &&
		!Array.isArray(x) &&
		!Array.isArray(y)
	) {
		return shallowEqual(x, y);
	}
	return false;
};

/** Inline option objects keep their identity while their fields don't change. */
function useStableOptions(options: MotionOptions): MotionOptions {
	const stable = useRef(options);
	if (!shallowEqual(stable.current, options, sameField))
		stable.current = options;
	return stable.current;
}

/**
 * Creates a motion unit: progress, springs, gestures and snap points, with no navigator.
 *
 * ```tsx
 * const motion = useMotion({ snapPoints: [0.5, 1], gestureDirection: "vertical" });
 *
 * <Button onPress={motion.open} />
 * <Transition.Motion value={motion}>
 *   <Sheet />
 * </Transition.Motion>
 * ```
 */
export function useMotion(options: MotionOptions = {}): Motion {
	const key = `motion${useId()}`;
	const values = useMotionValues();
	const stableOptions = useStableOptions(options);
	const optionsRef = useRef(stableOptions);
	optionsRef.current = stableOptions;

	const { snapPoints } = stableOptions;

	const openness = useDerivedValue(() => {
		let first = 1;
		if (snapPoints && snapPoints.length > 0) {
			first = Number.POSITIVE_INFINITY;
			for (const point of snapPoints) {
				const value =
					typeof point === "number"
						? point
						: values.resolvedAutoSnapPoint.get();
				if (value > 0 && value < first) first = value;
			}
			if (first === Number.POSITIVE_INFINITY) first = 1;
		}
		return Math.min(Math.max(values.visualProgress.get() / first, 0), 1);
	}, [snapPoints]);

	const status = useDerivedValue<MotionStatus>(() => {
		const atRest =
			values.transitionProgress.get() <= EPSILON &&
			!values.progressAnimating.get();
		if (values.closing.get()) return atRest ? "closed" : "closing";
		if (values.entering.get() && !values.progressSettled.get()) {
			return "opening";
		}
		return atRest ? "closed" : "open";
	});

	const { motion, requestClose } = useMemo(() => {
		const open = () => {
			const { snapPoints: points, initialSnapIndex = 0 } = optionsRef.current;
			const initial = getInitialProgress({
				snapPoints: points,
				initialSnapIndex,
			});
			scheduleOnUI(() => {
				"worklet";
				if (
					values.pendingLifecycleRequestKind.get() ===
					LifecycleTransitionRequestKind.Open
				) {
					return;
				}
				if (
					!values.closing.get() &&
					(values.transitionProgress.get() > EPSILON ||
						values.progressAnimating.get())
				) {
					return;
				}
				values.autoOpenArmed.set(1);
				let target = 1;
				if (typeof initial === "string") {
					const measured = values.resolvedAutoSnapPoint.get();
					// Not measured yet: the first measurement opens it.
					if (measured <= 0) return;
					target = measured;
				} else if (typeof initial === "number") {
					target = initial;
				}
				values.entering.set(1);
				values.actions.requestLifecycleTransition(
					LifecycleTransitionRequestKind.Open,
					target,
				);
			});
		};

		const close = () => {
			scheduleOnUI(() => {
				"worklet";
				values.autoOpenArmed.set(0);
				if (values.closing.get()) return;
				if (
					values.transitionProgress.get() <= EPSILON &&
					!values.progressAnimating.get() &&
					values.pendingLifecycleRequestKind.get() ===
						LifecycleTransitionRequestKind.None
				) {
					return;
				}
				values.actions.requestLifecycleTransition(
					LifecycleTransitionRequestKind.Close,
					0,
				);
			});
		};

		const snapTo = (index: number) => {
			snapDescriptorToIndex(
				createStandaloneDescriptor(key, optionsRef.current),
				index,
			);
		};

		const handle: Motion = {
			key,
			progress: values.visualProgress,
			openness,
			status,
			open,
			close,
			snapTo,
		};
		return {
			motion: handle,
			requestClose: () => {
				close();
				optionsRef.current.onRequestClose?.();
			},
		};
	}, [key, values, openness, status]);

	internals.set(motion, { values, options: stableOptions, requestClose });

	return motion;
}
