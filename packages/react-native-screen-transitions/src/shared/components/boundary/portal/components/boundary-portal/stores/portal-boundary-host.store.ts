import { useSyncExternalStore } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../../../types/animation.types";

export type ActivePortalBoundaryHost = {
	boundaryId: string;
	hostKey: string;
	pairKey: string;
	portalHostName: string;
	portalHostReady: SharedValue<boolean>;
	screenKey: string;
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

const buildSnapshot = (): PortalSnapshot => {
	const hostsByScope: Record<string, ActivePortalBoundaryHost[]> = {};

	for (const host of activeBoundaryHosts.values()) {
		const hosts = hostsByScope[host.hostKey] ?? [];
		hosts.push(host);
		hostsByScope[host.hostKey] = hosts;
	}

	return {
		hostsByScope,
	};
};

const emit = () => {
	snapshot = buildSnapshot();

	for (const listener of listeners) {
		listener();
	}
};

const isSameHost = (
	a: ActivePortalBoundaryHost,
	b: ActivePortalBoundaryHost,
) => {
	return (
		a.boundaryId === b.boundaryId &&
		a.hostKey === b.hostKey &&
		a.pairKey === b.pairKey &&
		a.portalHostName === b.portalHostName &&
		a.portalHostReady === b.portalHostReady &&
		a.screenKey === b.screenKey &&
		a.slotsMap === b.slotsMap
	);
};

export const mountPortalBoundaryHost = (host: ActivePortalBoundaryHost) => {
	const previous = activeBoundaryHosts.get(host.portalHostName);
	if (previous && isSameHost(previous, host)) {
		return;
	}

	activeBoundaryHosts.set(host.portalHostName, host);
	emit();
};

export const unmountPortalBoundaryHostByName = (
	portalHostName: string | null | undefined,
) => {
	if (!portalHostName || !activeBoundaryHosts.delete(portalHostName)) {
		return;
	}

	emit();
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
