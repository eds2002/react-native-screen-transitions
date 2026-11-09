import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import { useOptionalScreenHostStore } from "../../host/screen-host.provider";
import { useMotionStore } from "../../motion/motion.store";
import type { StackProgressEntry } from "./stack-progress";

const NO_ROUTE_KEYS: readonly string[] = [];

// A reader only uses its own route and the routes above it. Keep the selected
// keys stable when the stack changes below that reader; progress stays live.
function createStackProgressRouteSelector(currentRouteKey: string) {
	let previous: readonly string[] = [];
	return (
		store: { routeKeys: readonly string[] } | null,
	): readonly string[] => {
		const keys = store?.routeKeys ?? NO_ROUTE_KEYS;
		const index = keys.lastIndexOf(currentRouteKey);
		const length = index < 0 ? 0 : keys.length - index;
		if (
			previous.length === length &&
			previous.every((key, offset) => key === keys[index + offset])
		) {
			return previous;
		}
		previous = index < 0 ? [] : keys.slice(index);
		return previous;
	};
}

// Reanimated mapper IDs are positive. These listeners only attach to our own
// visualProgress values, and each mounted reader receives a distinct ID.
let nextListenerId = -1;

type ProgressInputs = {
	entries: SharedValue<readonly StackProgressEntry[]>;
	revision: SharedValue<number>;
	epoch: SharedValue<number>;
};

function registerStackProgressInputs(
	inputs: ProgressInputs,
	entries: readonly StackProgressEntry[],
	listenerId: number,
	epoch: number,
) {
	"worklet";
	const currentEpoch = inputs.epoch.get();
	if (Math.abs(currentEpoch) >= epoch) return;
	if (currentEpoch > 0) {
		for (const entry of inputs.entries.get()) {
			entry.visualProgress.removeListener(listenerId);
		}
	}
	inputs.entries.set(entries);
	inputs.epoch.set(epoch);
	const revision = inputs.revision;
	for (const entry of entries) {
		entry.visualProgress.addListener(listenerId, () => {
			// SharedValue listeners run synchronously after the value changes.
			// Invalidate the frame directly, without a cached sum or mapper hop.
			revision.set((value) => value + 1);
		});
	}
	revision.set((value) => value + 1);
}

function unregisterStackProgressInputs(
	inputs: ProgressInputs,
	listenerId: number,
	epoch: number,
) {
	"worklet";
	const currentEpoch = inputs.epoch.get();
	if (Math.abs(currentEpoch) > epoch) return;
	if (currentEpoch > 0) {
		for (const entry of inputs.entries.get()) {
			entry.visualProgress.removeListener(listenerId);
		}
	}
	// Tombstone even a setup that has not arrived yet. A stale job must not
	// install listeners after its owner has disconnected.
	inputs.epoch.set(-epoch);
}

export function useStackProgressInputs(currentRouteKey: string) {
	const selectProgressRoutes = useMemo(
		() => createStackProgressRouteSelector(currentRouteKey),
		[currentRouteKey],
	);

	const routeKeys = useOptionalScreenHostStore(selectProgressRoutes);
	const stackProgressValues = useMotionStore(
		routeKeys,
		(store) => store.state.visualProgress,
	);

	const entries = useMemo<readonly StackProgressEntry[]>(
		() =>
			routeKeys.flatMap((routeKey, index) => {
				const visualProgress = stackProgressValues[index];
				return visualProgress ? [{ routeKey, visualProgress }] : [];
			}),
		[routeKeys, stackProgressValues],
	);

	const liveEntries = useSharedValue(entries);
	const revision = useSharedValue(0);
	const epoch = useSharedValue(0);
	const [listenerId] = useState(() => nextListenerId--);
	const generation = useRef(0);

	useLayoutEffect(() => {
		const nextEpoch = ++generation.current;
		const inputs = { entries: liveEntries, revision, epoch };
		if (Platform.OS === "web") {
			registerStackProgressInputs(inputs, entries, listenerId, nextEpoch);
		} else {
			scheduleOnUI(
				registerStackProgressInputs,
				inputs,
				entries,
				listenerId,
				nextEpoch,
			);
		}
		return () => {
			if (Platform.OS === "web") {
				unregisterStackProgressInputs(inputs, listenerId, nextEpoch);
			} else {
				scheduleOnUI(
					unregisterStackProgressInputs,
					inputs,
					listenerId,
					nextEpoch,
				);
			}
		};
	}, [entries, liveEntries, revision, epoch, listenerId]);

	return { entries: liveEntries, revision };
}
