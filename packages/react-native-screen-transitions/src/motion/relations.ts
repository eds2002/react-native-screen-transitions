import { useCallback, useLayoutEffect, useSyncExternalStore } from "react";
import type { BaseStackDescriptor } from "../types/stack.types";

/**
 * Which unit currently sits above which. A unit created with `previous` registers itself as that
 * unit's `next` while it is mounted, so the lower unit animates as covered (its next's interpolator
 * drives it) and Boundary pairs the two, as a stack does for neighbouring screens.
 */
const nextByKey = new Map<string, BaseStackDescriptor>();
const listeners = new Map<string, Set<() => void>>();

const notify = (key: string) => {
	for (const listener of listeners.get(key) ?? []) listener();
};

/** The descriptor of the unit currently above `key`, if any. */
export function useNextDescriptor(
	key: string,
): BaseStackDescriptor | undefined {
	const subscribe = useCallback(
		(listener: () => void) => {
			const set = listeners.get(key) ?? new Set();
			set.add(listener);
			listeners.set(key, set);
			return () => {
				set.delete(listener);
				if (set.size === 0) listeners.delete(key);
			};
		},
		[key],
	);
	const get = useCallback(() => nextByKey.get(key), [key]);
	return useSyncExternalStore(subscribe, get, get);
}

/** While mounted, `descriptor` is the unit above `previousKey`. */
export function useRegisterAbove(
	previousKey: string | undefined,
	descriptor: BaseStackDescriptor,
) {
	useLayoutEffect(() => {
		if (!previousKey) return;
		nextByKey.set(previousKey, descriptor);
		notify(previousKey);
		return () => {
			if (nextByKey.get(previousKey) === descriptor) {
				nextByKey.delete(previousKey);
				notify(previousKey);
			}
		};
	}, [previousKey, descriptor]);
}
