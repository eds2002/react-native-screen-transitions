import type { SharedValue } from "react-native-reanimated";
import type {
	ClaimedDirections,
	Direction,
} from "../../../../types/ownership.types";
import { DIRECTIONS } from "../../../../types/ownership.types";
import { screenTopology } from "../../topology";
import type { ScreenTopology } from "../../topology/types";
import type {
	GestureOwnerMap,
	PanGesture,
	PinchGesture,
	ScreenGestureSource,
	ScrollGestureAxis,
	ScrollGestureState,
} from "../types";

export type GestureOwnershipRegistration = {
	screenKey: string;
	source: ScreenGestureSource;
	claimedDirections: ClaimedDirections;
	effectiveClaimedDirections: ClaimedDirections;
	owners: SharedValue<GestureOwnerMap>;
};

export type ScrollGestureCoordination = {
	panGestures: PanGesture[];
	pinchGestures: PinchGesture[];
	scrollStates: SharedValue<ScrollGestureState | null>[];
	ownerRouteKeys: string[];
};

export type GestureOwnershipCoordinator = {
	register(registration: GestureOwnershipRegistration): void;
	unregister(screenKey: string): void;
	getScrollCoordination(
		screenKey: string,
		axis: ScrollGestureAxis,
	): ScrollGestureCoordination;
	subscribe(screenKey: string, listener: () => void): () => void;
};

const EMPTY_SCROLL_COORDINATION: ScrollGestureCoordination = {
	panGestures: [],
	pinchGestures: [],
	scrollStates: [],
	ownerRouteKeys: [],
};

const createEmptyOwners = (): GestureOwnerMap => ({
	vertical: null,
	"vertical-inverted": null,
	horizontal: null,
	"horizontal-inverted": null,
});

const areOwnersEqual = (left: GestureOwnerMap, right: GestureOwnerMap) =>
	DIRECTIONS.every((direction) => left[direction] === right[direction]);

const areArraysEqual = <T>(left: readonly T[], right: readonly T[]) =>
	left.length === right.length &&
	left.every((value, index) => value === right[index]);

const areScrollCoordinationsEqual = (
	left: ScrollGestureCoordination,
	right: ScrollGestureCoordination,
) =>
	areArraysEqual(left.panGestures, right.panGestures) &&
	areArraysEqual(left.pinchGestures, right.pinchGestures) &&
	areArraysEqual(left.scrollStates, right.scrollStates) &&
	areArraysEqual(left.ownerRouteKeys, right.ownerRouteKeys);

const getAxisDirections = (
	axis: ScrollGestureAxis,
): readonly [Direction, Direction] =>
	axis === "vertical"
		? ["vertical", "vertical-inverted"]
		: ["horizontal", "horizontal-inverted"];

export const createGestureOwnershipCoordinator = (
	topology: ScreenTopology,
): GestureOwnershipCoordinator => {
	const registrations = new Map<string, GestureOwnershipRegistration>();
	const scrollCache = new Map<
		string,
		Record<ScrollGestureAxis, ScrollGestureCoordination>
	>();
	const listenersByScreenKey = new Map<string, Set<() => void>>();

	const getNearestAncestorOwner = (screenKey: string, direction: Direction) => {
		const visited = new Set<string>();
		let candidate: string | null = screenKey;

		while (candidate && !visited.has(candidate)) {
			visited.add(candidate);
			if (registrations.get(candidate)?.claimedDirections[direction]) {
				return candidate;
			}
			candidate = topology.getRelationships(candidate).parentScreenKey;
		}

		return null;
	};

	const getDeepestActiveOwner = (screenKey: string, direction: Direction) => {
		const visited = new Set<string>();
		let candidate: string | null = screenKey;
		let owner: string | null = null;
		let isOrigin = true;

		while (candidate && !visited.has(candidate)) {
			visited.add(candidate);
			const registration = registrations.get(candidate);
			const claims = isOrigin
				? registration?.claimedDirections
				: registration?.effectiveClaimedDirections;
			if (claims?.[direction]) owner = candidate;

			candidate = topology.getRelationships(candidate).activeChildScreenKey;
			isOrigin = false;
		}

		return owner;
	};

	const resolveOwners = (screenKey: string): GestureOwnerMap => {
		const owners = createEmptyOwners();
		for (const direction of DIRECTIONS) {
			owners[direction] =
				getDeepestActiveOwner(screenKey, direction) ??
				getNearestAncestorOwner(screenKey, direction);
		}
		return owners;
	};

	const resolveScrollCoordination = (
		screenKey: string,
		axis: ScrollGestureAxis,
	): ScrollGestureCoordination => {
		const ownerKeys: string[] = [];
		for (const direction of getAxisDirections(axis)) {
			const ownerKey = getNearestAncestorOwner(screenKey, direction);
			if (ownerKey && !ownerKeys.includes(ownerKey)) ownerKeys.push(ownerKey);
		}

		const panGestures: PanGesture[] = [];
		const scrollStates: SharedValue<ScrollGestureState | null>[] = [];
		for (const ownerKey of ownerKeys) {
			const source = registrations.get(ownerKey)?.source;
			if (!source) continue;
			panGestures.push(source.panGesture);
			scrollStates.push(source.scrollState);
		}

		const pinchGestures: PinchGesture[] = [];
		const visited = new Set<string>();
		let candidate: string | null = screenKey;
		while (candidate && !visited.has(candidate)) {
			visited.add(candidate);
			const pinchGesture = registrations.get(candidate)?.source.pinchGesture;
			if (pinchGesture && !pinchGestures.includes(pinchGesture)) {
				pinchGestures.push(pinchGesture);
			}
			candidate = topology.getRelationships(candidate).parentScreenKey;
		}

		return {
			panGestures,
			pinchGestures,
			scrollStates,
			ownerRouteKeys: ownerKeys,
		};
	};

	const notify = (screenKey: string) => {
		for (const listener of listenersByScreenKey.get(screenKey) ?? []) {
			listener();
		}
	};

	const recompute = () => {
		for (const [screenKey, registration] of registrations) {
			const nextOwners = resolveOwners(screenKey);
			if (!areOwnersEqual(registration.owners.get(), nextOwners)) {
				registration.owners.set(nextOwners);
			}

			const previousScroll = scrollCache.get(screenKey);
			const nextScroll = {
				vertical: resolveScrollCoordination(screenKey, "vertical"),
				horizontal: resolveScrollCoordination(screenKey, "horizontal"),
			};
			const vertical =
				previousScroll &&
				areScrollCoordinationsEqual(
					previousScroll.vertical,
					nextScroll.vertical,
				)
					? previousScroll.vertical
					: nextScroll.vertical;
			const horizontal =
				previousScroll &&
				areScrollCoordinationsEqual(
					previousScroll.horizontal,
					nextScroll.horizontal,
				)
					? previousScroll.horizontal
					: nextScroll.horizontal;
			if (
				!previousScroll ||
				vertical !== previousScroll.vertical ||
				horizontal !== previousScroll.horizontal
			) {
				scrollCache.set(screenKey, { vertical, horizontal });
				notify(screenKey);
			}
		}
	};

	topology.subscribeResolution(recompute);

	return {
		register: (registration) => {
			registrations.set(registration.screenKey, registration);
			recompute();
		},
		unregister: (screenKey) => {
			if (!registrations.has(screenKey)) return;

			registrations.delete(screenKey);
			scrollCache.delete(screenKey);
			recompute();
			notify(screenKey);
		},
		getScrollCoordination: (screenKey, axis) =>
			scrollCache.get(screenKey)?.[axis] ?? EMPTY_SCROLL_COORDINATION,
		subscribe: (screenKey, listener) => {
			const listeners =
				listenersByScreenKey.get(screenKey) ?? new Set<() => void>();
			listeners.add(listener);
			listenersByScreenKey.set(screenKey, listeners);

			return () => {
				listeners.delete(listener);
				if (listeners.size === 0) listenersByScreenKey.delete(screenKey);
			};
		},
	};
};

export const gestureOwnershipCoordinator =
	createGestureOwnershipCoordinator(screenTopology);
