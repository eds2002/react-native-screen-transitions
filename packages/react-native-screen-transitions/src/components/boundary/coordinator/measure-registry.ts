import { useLayoutEffect } from "react";
import { makeMutable } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import {
	applyEntryOps,
	type EntryOp,
} from "../../../stores/bounds/internals/entries";
import type { BoundTag, ScreenKey, TagID } from "../../../stores/bounds/types";
import type { MeasureBoundary } from "../types";

/**
 * The boundaries each screen's coordinator can measure. Lives on the UI thread; JS only sends
 * changes. One coordinator per screen watches the pairs and asks these boundaries to measure, so a
 * boundary itself runs no reaction (each one used to run its own source and refresh reactions).
 */
export type RegisteredBoundary = {
	id: number;
	linkKey: BoundTag["linkKey"];
	group?: BoundTag["group"];
	measure: MeasureBoundary;
};

export type BoundaryMeasureRegistry = Record<
	ScreenKey,
	Record<TagID, RegisteredBoundary>
>;

export const boundaryMeasureRegistry = makeMutable<BoundaryMeasureRegistry>({});

type RegistryOp =
	| {
			screenKey: ScreenKey;
			tag: TagID;
			entry: RegisteredBoundary;
	  }
	| { screenKey: ScreenKey; tag: TagID; removeId: number };

const applyRegistryOps = (ops: RegistryOp[]) => {
	"worklet";
	boundaryMeasureRegistry.modify(
		(state: BoundaryMeasureRegistry): BoundaryMeasureRegistry => {
			"worklet";
			for (const op of ops) {
				if ("entry" in op) {
					if (!state[op.screenKey]) state[op.screenKey] = {};
					state[op.screenKey][op.tag] = op.entry;
					continue;
				}
				const screen = state[op.screenKey];
				// Only the registration that is leaving: a remount with the same tag may already be in.
				if (screen?.[op.tag]?.id !== op.removeId) continue;
				delete screen[op.tag];
				let empty = true;
				for (const _ in screen) {
					empty = false;
					break;
				}
				if (empty) delete state[op.screenKey];
			}
			return state;
		},
	);
};

const applyBoundaryOps = (registryOps: RegistryOp[], entryOps: EntryOp[]) => {
	"worklet";
	if (entryOps.length) applyEntryOps(entryOps);
	if (registryOps.length) applyRegistryOps(registryOps);
};

// Mounting a list registers every boundary (its presence in the bounds registry and its place in
// its screen's measure registry) in one UI call, not calls per boundary.
let pendingOps: RegistryOp[] = [];
let pendingEntryOps: EntryOp[] = [];
let flushScheduled = false;
const scheduleFlush = () => {
	if (flushScheduled) return;
	flushScheduled = true;
	queueMicrotask(() => {
		flushScheduled = false;
		const ops = pendingOps;
		const entryOps = pendingEntryOps;
		pendingOps = [];
		pendingEntryOps = [];
		scheduleOnUI(applyBoundaryOps, ops, entryOps);
	});
};
const queueRegistryOp = (op: RegistryOp) => {
	pendingOps.push(op);
	scheduleFlush();
};
/** A boundary's presence in the bounds registry, sent with the next registry flush. */
export const queueEntryOp = (op: EntryOp) => {
	pendingEntryOps.push(op);
	scheduleFlush();
};

let nextRegistrationId = 0;

/** Makes this boundary measurable by its screen's coordinator while it is enabled and mounted. */
export function useBoundaryMeasureRegistration({
	enabled,
	boundTag,
	currentScreenKey,
	measureBoundary,
}: {
	enabled: boolean;
	boundTag: BoundTag;
	currentScreenKey: ScreenKey;
	measureBoundary: MeasureBoundary;
}) {
	const { tag, linkKey, group } = boundTag;
	useLayoutEffect(() => {
		if (!enabled) return;
		const id = ++nextRegistrationId;
		queueRegistryOp({
			screenKey: currentScreenKey,
			tag,
			entry: { id, linkKey, group, measure: measureBoundary },
		});
		return () => {
			queueRegistryOp({ screenKey: currentScreenKey, tag, removeId: id });
		};
	}, [enabled, tag, linkKey, group, currentScreenKey, measureBoundary]);
}
