import { useSyncExternalStore } from "react";

export type ActivePortalBoundaryHost = {
	boundaryId: string;
	capturesScroll: boolean;
	hostKey: string;
	pairKey: string;
	screenKey: string;
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
		a.capturesScroll === b.capturesScroll &&
		a.hostKey === b.hostKey &&
		a.pairKey === b.pairKey &&
		a.screenKey === b.screenKey
	);
};

export const mountPortalBoundaryHost = (host: ActivePortalBoundaryHost) => {
	const previous = activeBoundaryHosts.get(host.boundaryId);
	if (previous && isSameHost(previous, host)) {
		return;
	}

	activeBoundaryHosts.set(host.boundaryId, host);
	emit();
};

export const unmountPortalBoundaryHost = (boundaryId: string) => {
	if (!activeBoundaryHosts.delete(boundaryId)) {
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
