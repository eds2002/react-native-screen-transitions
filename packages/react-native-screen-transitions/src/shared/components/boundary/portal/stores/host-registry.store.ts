import { useSyncExternalStore } from "react";
import { logger } from "../../../../utils/logger";

export type HostRegistration = {
	hostKey: string;
	screenKey: string;
	fallback: boolean;
	capturesScroll: boolean;
};

type HostRegistrySnapshot = Record<string, string>;

const EMPTY_SNAPSHOT: HostRegistrySnapshot = {};
const MULTIPLE_USER_HOSTS_WARNING =
	"Multiple portal hosts were registered for the same screen. Only the latest non-fallback host will be used.";

const listeners = new Set<() => void>();
const hostStacks = new Map<string, HostRegistration[]>();

let snapshot: HostRegistrySnapshot = EMPTY_SNAPSHOT;

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

const emit = () => {
	snapshot = buildSnapshot();

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

	const isDev = typeof __DEV__ === "undefined" || __DEV__;
	if (
		isDev &&
		!registration.fallback &&
		nextStack.some((host) => !host.fallback)
	) {
		logger.warn(MULTIPLE_USER_HOSTS_WARNING);
	}

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
	emit();
};
