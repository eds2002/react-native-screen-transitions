import type { SharedValue } from "react-native-reanimated";
import {
	type CanonicalSmoothClipPresentation,
	canonicalizeClipPresentation,
	type SmoothClipGroup,
	type SmoothClipPresentation,
	type SmoothClipRef,
} from "react-native-smooth-clip-view";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import {
	type BuiltInClipRuntimeBlocker,
	type BuiltInClipRuntimePlanId,
	getBuiltInClipRuntimeMarker,
} from "../../../utils/bounds/navigation/clip/runtime-metadata";
import {
	type LegacyClipFootprint,
	resolveLegacyClipProjection,
} from "./legacy-clip-projector";

type ClipSlot = {
	clip?: SmoothClipPresentation | null;
	style?: unknown;
};

export type ClipStreamUIRegistration = Readonly<{
	base: CanonicalSmoothClipPresentation;
	clip: SmoothClipRef;
	footprint?: LegacyClipFootprint;
	projection?: "explicit" | "legacy";
	registrationId: number;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	streamingSuspended?: SharedValue<number>;
	styleId: string;
	trustedPlanIds?: readonly string[];
}>;

type ClipStreamUIRoot = Readonly<{
	participants: SharedValue<readonly ClipStreamUIRegistration[]>;
	rootId: number;
	routeKey: string;
	setFrames: SmoothClipGroup["ui"]["setFrames"];
}>;

export type ClipStreamCanonicalSnapshot = Readonly<{
	activeBlockers?: readonly BuiltInClipRuntimeBlocker[];
	driverId: number;
	planId?: BuiltInClipRuntimePlanId;
	presentation: CanonicalSmoothClipPresentation;
	ready: boolean;
	slotId?: string;
}>;

export type ClipStreamFlushCallback = (
	snapshots: readonly ClipStreamCanonicalSnapshot[],
) => void;

type ClipStreamWorkletGlobal = typeof globalThis & {
	__screenTransitionClipRoots?: Record<number, ClipStreamUIRoot>;
	__screenTransitionClipReleaseId?: number;
	queueMicrotask(callback: () => void): void;
};

const getWorkletGlobal = () => {
	"worklet";
	return globalThis as ClipStreamWorkletGlobal;
};

const getClipRoots = () => {
	"worklet";
	const workletGlobal = getWorkletGlobal();
	if (workletGlobal.__screenTransitionClipRoots === undefined) {
		workletGlobal.__screenTransitionClipRoots = {};
	}
	return workletGlobal.__screenTransitionClipRoots;
};

export const registerClipStreamRootOnUI = (root: ClipStreamUIRoot) => {
	"worklet";
	getClipRoots()[root.rootId] = root;
};

export const updateClipStreamRootRouteOnUI = (
	rootId: number,
	routeKey: string,
) => {
	"worklet";
	const roots = getClipRoots();
	const root = roots[rootId];
	if (root === undefined || root.routeKey === routeKey) return;
	roots[rootId] = { ...root, routeKey };
};

export const unregisterClipStreamRootOnUI = (rootId: number) => {
	"worklet";
	delete getClipRoots()[rootId];
};

/**
 * Flushes the latest projected slot values synchronously in the gesture-end
 * worklet. This closes the final-UP gap before gesture stores start resetting.
 */
export const flushClipStreamRouteOnUI = (
	routeKey: string,
): readonly ClipStreamCanonicalSnapshot[] => {
	"worklet";
	const roots = getClipRoots();
	const rootIds = Object.keys(roots)
		.map(Number)
		.sort((left, right) => left - right);
	const entries: {
		clip: SmoothClipRef;
		frame: CanonicalSmoothClipPresentation;
	}[] = [];
	const snapshots: ClipStreamCanonicalSnapshot[] = [];
	const seenRegistrations: Record<number, boolean> = {};
	let batchOwner: ClipStreamUIRoot | undefined;

	for (let rootIndex = 0; rootIndex < rootIds.length; rootIndex += 1) {
		const rootId = rootIds[rootIndex];
		if (rootId === undefined) continue;
		const root = roots[rootId];
		if (root === undefined || root.routeKey !== routeKey) continue;
		batchOwner ??= root;

		const participants = root.participants.get();
		for (let index = 0; index < participants.length; index += 1) {
			const participant = participants[index];
			if (participant === undefined) continue;
			const driverId = participant.registrationId;
			if (driverId <= 0 || seenRegistrations[driverId] === true) continue;

			const slot = participant.slotsMap.get()[participant.styleId] as
				| ClipSlot
				| undefined;
			const marker = getBuiltInClipRuntimeMarker(slot?.clip);
			let requested: SmoothClipPresentation = participant.base;
			if (participant.projection === "legacy") {
				const projected = resolveLegacyClipProjection({
					clip: slot?.clip,
					footprint: participant.footprint ?? { height: 0, width: 0 },
					style: slot?.style as Readonly<Record<string, unknown>> | undefined,
				});
				if (projected.kind === "clip") {
					requested = projected.presentation;
				} else if (
					projected.kind === "fallback" &&
					projected.reason === "invalid-explicit-clip"
				) {
					return [];
				}
			} else {
				requested = slot?.clip ?? participant.base;
			}
			const presentation = canonicalizeClipPresentation(requested);
			// Preserve atomic semantics: one malformed member rejects the final-UP
			// batch instead of moving only a subset of the physical apertures.
			if (presentation === null) return [];

			seenRegistrations[driverId] = true;
			entries.push({ clip: participant.clip, frame: presentation });
			const trustedMarker =
				marker !== null &&
				marker.slotId === participant.styleId &&
				participant.trustedPlanIds?.includes(marker.planId) === true
					? marker
					: null;
			snapshots.push({
				...(trustedMarker === null
					? {}
					: {
							activeBlockers: trustedMarker.activeBlockers,
							planId: trustedMarker.planId,
							slotId: trustedMarker.slotId,
						}),
				driverId,
				presentation,
				// Native-only SmoothClip drivers no longer expose the former web-host
				// readiness SharedValue. Group snapshots perform the authoritative
				// native attachment check before any autonomous promotion.
				ready: true,
			});
		}
	}

	if (batchOwner !== undefined && entries.length > 0) {
		batchOwner.setFrames(entries);
	}
	return snapshots;
};

/**
 * Defers the route flush until the current UI-runtime job has finished. Gesture
 * SharedValue writes dirty the interpolation mappers, and Reanimated runs those
 * mappers before draining this microtask. The slot map therefore represents the
 * gesture event that scheduled the flush instead of the preceding event.
 */
export const scheduleClipStreamRouteFlushOnUI = (
	routeKey: string,
	onFlushed?: ClipStreamFlushCallback,
) => {
	"worklet";
	getWorkletGlobal().queueMicrotask(() => {
		"worklet";
		const snapshots = flushClipStreamRouteOnUI(routeKey);
		onFlushed?.(snapshots);
	});
};

export const allocateClipGestureReleaseIdOnUI = () => {
	"worklet";
	const workletGlobal = getWorkletGlobal();
	const nextId = (workletGlobal.__screenTransitionClipReleaseId ?? 0) + 1;
	workletGlobal.__screenTransitionClipReleaseId = nextId;
	return nextId;
};
