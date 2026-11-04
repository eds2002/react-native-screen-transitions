import { useSyncExternalStore } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";
import type { BoundaryLocalMeasurementValue } from "../../types";

export type ActivePortalBoundaryHost = {
	boundaryId: string;
	hostKey: string;
	localMeasurement: BoundaryLocalMeasurementValue;
	portalHostName: string;
	portalHostReady: SharedValue<boolean>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
};

type PortalSnapshot = {
	hostsByScope: Record<string, ActivePortalBoundaryHost[]>;
};

const EMPTY_HOSTS: ActivePortalBoundaryHost[] = [];

const listeners = new Set<() => void>();
const activeBoundaryHosts = new Map<string, ActivePortalBoundaryHost>();

let snapshot: PortalSnapshot = {
	hostsByScope: {},
};

// Preserve other overlays' snapshots so a registration only rerenders its owners.
const emit = (...hostKeys: string[]) => {
	const hostsByScope = { ...snapshot.hostsByScope };
	for (const hostKey of new Set(hostKeys)) {
		hostsByScope[hostKey] = Array.from(activeBoundaryHosts.values()).filter(
			(host) => host.hostKey === hostKey,
		);
		if (!hostsByScope[hostKey].length) delete hostsByScope[hostKey];
	}
	snapshot = { hostsByScope };
	for (const listener of listeners) listener();
};

const isSameHost = (
	a: ActivePortalBoundaryHost,
	b: ActivePortalBoundaryHost,
) => {
	return (
		a.boundaryId === b.boundaryId &&
		a.hostKey === b.hostKey &&
		a.localMeasurement === b.localMeasurement &&
		a.portalHostName === b.portalHostName &&
		a.portalHostReady === b.portalHostReady &&
		a.slotsMap === b.slotsMap
	);
};

export const mountPortalBoundaryHost = (host: ActivePortalBoundaryHost) => {
	const previous = activeBoundaryHosts.get(host.portalHostName);
	if (previous && isSameHost(previous, host)) {
		return;
	}

	activeBoundaryHosts.set(host.portalHostName, host);
	emit(host.hostKey, previous?.hostKey ?? host.hostKey);
};

export const unmountPortalBoundaryHostByName = (
	portalHostName: string | null | undefined,
) => {
	const host = portalHostName
		? activeBoundaryHosts.get(portalHostName)
		: undefined;
	if (!host) {
		return;
	}

	activeBoundaryHosts.delete(host.portalHostName);
	emit(host.hostKey);
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);

	return () => {
		listeners.delete(listener);
	};
};

export const useActivePortalBoundaryHosts = (hostKey: string) => {
	return useSyncExternalStore(
		subscribe,
		() => snapshot.hostsByScope[hostKey] ?? EMPTY_HOSTS,
		() => EMPTY_HOSTS,
	);
};
