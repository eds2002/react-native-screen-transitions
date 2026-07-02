import { useSyncExternalStore } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { LocalStyleLayers } from "../../../../providers/screen/styles/helpers/resolve-slot-styles";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";

export type ActivePortalBoundaryHost = {
	boundaryId: string;
	escapeClipping: boolean;
	hostKey: string;
	localStylesMaps: SharedValue<LocalStyleLayers>;
	pairKey: string;
	portalHostName: string;
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
		a.escapeClipping === b.escapeClipping &&
		a.hostKey === b.hostKey &&
		a.localStylesMaps === b.localStylesMaps &&
		a.pairKey === b.pairKey &&
		a.portalHostName === b.portalHostName &&
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

export const unmountPortalBoundaryHost = (boundaryId: string) => {
	let didDelete = false;

	for (const [hostEntryKey, host] of activeBoundaryHosts) {
		if (host.boundaryId !== boundaryId) {
			continue;
		}

		activeBoundaryHosts.delete(hostEntryKey);
		didDelete = true;
	}

	if (!didDelete) {
		return;
	}

	emit();
};

/**
 * Post-handoff GC: drop every receiver for this boundary except the one now
 * visible (`keepPortalHostName`). Called once the new host is confirmed on
 * screen so the superseded receivers stop rendering.
 */
export const dropStalePortalBoundaryHosts = ({
	boundaryId,
	keepPortalHostName,
}: {
	boundaryId: string;
	keepPortalHostName: string;
}) => {
	let didDelete = false;

	for (const [hostEntryKey, host] of activeBoundaryHosts) {
		if (
			host.boundaryId !== boundaryId ||
			host.portalHostName === keepPortalHostName
		) {
			continue;
		}

		activeBoundaryHosts.delete(hostEntryKey);
		didDelete = true;
	}

	if (!didDelete) {
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
