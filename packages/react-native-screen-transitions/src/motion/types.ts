import type { DerivedValue, SharedValue } from "react-native-reanimated";
import type { MotionValues } from "../providers/motion/types";
import type { ScreenTransitionConfig } from "../types/screen.types";

/** Where a motion unit is in its life: at rest closed or open, or moving between them. */
export type MotionStatus = "closed" | "opening" | "open" | "closing";

export type MotionOptions = ScreenTransitionConfig & {
	/**
	 * How the unit mounts. `"closed"` (default): hidden at progress 0 until `open()`.
	 * `"open"`: already at its initial snap point, visible, without an open transition.
	 */
	initial?: "open" | "closed";
	/**
	 * A gesture or the backdrop dismissed the unit. It is already closing; use this to update
	 * your own state (for example, the `open` flag you pass to `Transition.Presence`).
	 */
	onRequestClose?: () => void;
	/** The open transition finished. */
	onOpen?: () => void;
	/** The close transition finished: the unit is at rest, closed. */
	onClose?: () => void;
	/**
	 * The unit this one opens over, as a pushed screen opens over the one below it. While this
	 * unit is mounted, `previous` is covered by it: this unit's interpolator animates both (its
	 * `next`/`previous` props), and `Transition.Boundary` pairs them, so `navigation.zoom()` can
	 * grow from a boundary in `previous`.
	 */
	previous?: Motion;
};

/**
 * One motion unit: progress, springs, gestures and snap points, with no navigator.
 * Render it with `<Transition.Motion value={motion}>`.
 */
export interface Motion {
	/** Identifies the unit's stores. Unique per `useMotion` call. */
	readonly key: string;
	/** Live progress, following the finger during a drag. 0 = closed, 1 = fully open. */
	readonly progress: SharedValue<number>;
	/**
	 * Progress normalized to the unit's first snap point: 1 once it is open at all, whatever
	 * its detent. Without snap points, the same as `progress` clamped to 0..1.
	 */
	readonly openness: DerivedValue<number>;
	readonly status: DerivedValue<MotionStatus>;
	/** Animates open to the initial snap point. No-op while open or opening. */
	open(): void;
	/** Animates closed. No-op while closed or closing. */
	close(): void;
	/** Animates to a snap point (0-based, sorted ascending). */
	snapTo(index: number): void;
}

/** What `Transition.Motion` needs from a handle; kept off the public type. */
export interface MotionInternals {
	values: MotionValues;
	options: MotionOptions;
	/** Closes from a gesture or the backdrop: close(), then onRequestClose. */
	requestClose: () => void;
}
