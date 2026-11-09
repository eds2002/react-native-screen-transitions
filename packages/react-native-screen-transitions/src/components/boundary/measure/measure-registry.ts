import { useLayoutEffect } from "react";
import { makeMutable } from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";
import type { BoundTag, ScreenKey, TagID } from "../../../stores/bounds";
import { applyEntryOps, type EntryOp } from "../../../stores/bounds";
import { forgetAppliedStyleKeys } from "../presentation/applied-style-keys";
import { forgetLocalMeasurements } from "./local-measurements";
import type { BoundaryMeasureData } from "./use-measurer";

/**
 * The boundaries each screen's coordinator can measure. Lives on the UI thread; JS only sends
 * changes. One coordinator per screen watches the pairs and asks these boundaries to measure, so a
 * boundary itself runs no reaction.
 */
type RegisteredBoundary = {
	id: number;
	linkKey: BoundTag["linkKey"];
	group?: BoundTag["group"];
	/** What measuring this boundary needs of its own (its screen's coordinator brings the rest). */
	data: BoundaryMeasureData;
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

const applyBoundaryOps = (
	registryOps: RegistryOp[],
	entryOps: EntryOp[],
	forgottenStyleKeys: number[],
	forgottenMeasurementKeys: number[],
) => {
	"worklet";
	if (entryOps.length) applyEntryOps(entryOps);
	if (registryOps.length) applyRegistryOps(registryOps);
	if (forgottenStyleKeys.length) forgetAppliedStyleKeys(forgottenStyleKeys);
	if (forgottenMeasurementKeys.length)
		forgetLocalMeasurements(forgottenMeasurementKeys);
};

// Mounting a list registers every boundary (its presence in the bounds registry and its place in
// its screen's measure registry) in one UI call, not calls per boundary.
let pendingOps: RegistryOp[] = [];
let pendingEntryOps: EntryOp[] = [];
let pendingForgottenStyleKeys: number[] = [];
let pendingForgottenMeasurementKeys: number[] = [];
let flushScheduled = false;
const scheduleFlush = () => {
	if (flushScheduled) return;
	flushScheduled = true;
	queueMicrotask(() => {
		flushScheduled = false;
		const ops = pendingOps;
		const entryOps = pendingEntryOps;
		const forgottenStyleKeys = pendingForgottenStyleKeys;
		const forgottenMeasurementKeys = pendingForgottenMeasurementKeys;
		pendingOps = [];
		pendingEntryOps = [];
		pendingForgottenStyleKeys = [];
		pendingForgottenMeasurementKeys = [];
		scheduleOnUI(
			applyBoundaryOps,
			ops,
			entryOps,
			forgottenStyleKeys,
			forgottenMeasurementKeys,
		);
	});
};
const queueRegistryOp = (op: RegistryOp) => {
	pendingOps.push(op);
	scheduleFlush();
};
/** An unmounted boundary style's applied keys, dropped with the next registry flush. */
export const queueForgetAppliedStyleKeys = (key: number) => {
	pendingForgottenStyleKeys.push(key);
	scheduleFlush();
};
/** An unmounted boundary's last transition measurement, dropped with the next registry flush. */
export const queueForgetLocalMeasurement = (key: number) => {
	pendingForgottenMeasurementKeys.push(key);
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
	measureData,
}: {
	enabled: boolean;
	boundTag: BoundTag;
	currentScreenKey: ScreenKey;
	measureData: BoundaryMeasureData;
}) {
	const { tag, linkKey, group } = boundTag;
	useLayoutEffect(() => {
		if (!enabled) return;
		const id = ++nextRegistrationId;
		queueRegistryOp({
			screenKey: currentScreenKey,
			tag,
			entry: { id, linkKey, group, data: measureData },
		});
		return () => {
			queueRegistryOp({ screenKey: currentScreenKey, tag, removeId: id });
		};
	}, [enabled, tag, linkKey, group, currentScreenKey, measureData]);
}
