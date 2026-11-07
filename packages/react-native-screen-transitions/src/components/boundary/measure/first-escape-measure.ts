import { useLayoutEffect, useState } from "react";

/**
 * Tells a boundary's React side that it was measured for a transition for the first time.
 *
 * The measuring worklet runs on the UI thread and reaches React through this module-level function
 * and a numeric key, never through a per-boundary callback: a JS function captured by a UI worklet
 * stays referenced by the UI runtime until that runtime collects, which it rarely does. A per-boundary
 * callback (it holds a state setter, so the boundary's fiber) kept every unmounted boundary alive, and
 * each remount of a list got slower and heavier.
 */
const listeners = new Map<number, () => void>();
let nextKey = 0;

export function notifyFirstEscapeMeasure(key: number) {
	listeners.get(key)?.();
}

/** Returns the key the measurer passes to `notifyFirstEscapeMeasure`; `onMeasured` runs for it while mounted. */
export function useFirstEscapeMeasureKey(onMeasured: () => void) {
	const [key] = useState(() => ++nextKey);
	useLayoutEffect(() => {
		listeners.set(key, onMeasured);
		return () => {
			listeners.delete(key);
		};
	}, [key, onMeasured]);
	return key;
}
