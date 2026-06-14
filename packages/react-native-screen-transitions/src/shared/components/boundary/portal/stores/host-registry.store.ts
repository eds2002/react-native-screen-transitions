import { useSyncExternalStore } from "react";
import { makeMutable } from "react-native-reanimated";
import type { SourceHostRef } from "../../../../stores/bounds/types";

export type HostRegistration = {
	hostKey: string;
	screenKey: string;
	fallback: boolean;
	capturesScroll: boolean;
};

type HostRegistrySnapshot = Record<string, string>;

const EMPTY_SNAPSHOT: HostRegistrySnapshot = {};

const listeners = new Set<() => void>();
const hostStacks = new Map<string, HostRegistration[]>();

let snapshot: HostRegistrySnapshot = EMPTY_SNAPSHOT;

/**
 * UI-readable mirror of each screen's active host, kept only for hosts that
 * capture scroll. Measurement worklets read it to record which scroll-scoped
 * host a source boundary originated from — at measure time, without any React
 * subscription on the boundary itself.
 */
const activeScrollHosts = makeMutable<Record<string, SourceHostRef>>({});

const getActiveHostFromStack = (
	screenKey: string,
	stack: HostRegistration[] | undefined,
) => {
	if (!stack || stack.length === 0) {
		return screenKey;
	}

	for (let index = stack.length - 1; index >= 0; index--) {
		const host = stack[index];
		if (!host.fallback) {
			return host.hostKey;
		}
	}

	return stack[0]?.hostKey ?? screenKey;
};

const buildSnapshot = (): HostRegistrySnapshot => {
	const nextSnapshot: HostRegistrySnapshot = {};

	for (const [screenKey, stack] of hostStacks) {
		nextSnapshot[screenKey] = getActiveHostFromStack(screenKey, stack);
	}

	return nextSnapshot;
};

const buildScrollHostSnapshot = (): Record<string, SourceHostRef> => {
	const nextSnapshot: Record<string, SourceHostRef> = {};

	for (const [screenKey, stack] of hostStacks) {
		const activeHostKey = getActiveHostFromStack(screenKey, stack);
		const activeHost = stack.find((host) => host.hostKey === activeHostKey);

		if (activeHost?.capturesScroll) {
			nextSnapshot[screenKey] = {
				hostKey: activeHost.hostKey,
				capturesScroll: true,
			};
		}
	}

	return nextSnapshot;
};

const emit = () => {
	snapshot = buildSnapshot();
	activeScrollHosts.set(buildScrollHostSnapshot());

	for (const listener of listeners) {
		listener();
	}
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);

	return () => {
		listeners.delete(listener);
	};
};

export const registerHost = (registration: HostRegistration) => {
	const stack = hostStacks.get(registration.screenKey) ?? [];
	const previousActiveHostKey = getActiveHostFromStack(
		registration.screenKey,
		stack,
	);
	const nextStack = stack.filter(
		(host) => host.hostKey !== registration.hostKey,
	);

	if (registration.fallback) {
		nextStack.unshift(registration);
	} else {
		nextStack.push(registration);
	}

	hostStacks.set(registration.screenKey, nextStack);

	if (
		previousActiveHostKey ===
		getActiveHostFromStack(registration.screenKey, nextStack)
	) {
		return;
	}

	emit();
};

export const unregisterHost = (screenKey: string, hostKey: string) => {
	const stack = hostStacks.get(screenKey);
	if (!stack) {
		return;
	}

	const previousActiveHostKey = getActiveHostFromStack(screenKey, stack);
	const nextStack = stack.filter((host) => host.hostKey !== hostKey);

	if (nextStack.length === 0) {
		hostStacks.delete(screenKey);
	} else {
		hostStacks.set(screenKey, nextStack);
	}

	if (previousActiveHostKey === getActiveHostFromStack(screenKey, nextStack)) {
		return;
	}

	emit();
};

export const getActiveHostKey = (screenKey: string) => {
	return snapshot[screenKey] ?? screenKey;
};

/**
 * The screen's active host, if it captures scroll. Worklet-safe: measurement
 * code calls this on the UI thread while writing source bounds.
 */
export const getActiveScrollHost = (
	screenKey: string,
): SourceHostRef | null => {
	"worklet";
	return activeScrollHosts.get()[screenKey] ?? null;
};

export const getHostCapturesScroll = (hostKey: string) => {
	for (const stack of hostStacks.values()) {
		const host = stack.find((registration) => registration.hostKey === hostKey);

		if (host) {
			return host.capturesScroll;
		}
	}

	return false;
};

export const useActiveHostKey = (screenKey?: string | null) => {
	return useSyncExternalStore(
		subscribe,
		() => (screenKey ? getActiveHostKey(screenKey) : undefined),
		() => undefined,
	);
};

export const resetHostRegistry = () => {
	hostStacks.clear();
	snapshot = EMPTY_SNAPSHOT;
	activeScrollHosts.set({});
	emit();
};
