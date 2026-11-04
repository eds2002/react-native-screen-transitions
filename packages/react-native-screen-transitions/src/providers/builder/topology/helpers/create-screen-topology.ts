import type {
	ActiveScreenRegistration,
	ScreenRelationships,
	ScreenTopology,
	ScreenTopologyRegistration,
} from "../types";

type ScreenNode = {
	registered: boolean;
	navigatorKey: string | null;
	parentScreenKey: string | null;
	activeChildScreenKeys: string[];
	transitionKey: string | null;
};

const EMPTY_RELATIONSHIPS: ScreenRelationships = {
	parentScreenKey: null,
	activeChildScreenKey: null,
	activeChildNavigatorKey: null,
};

const areRelationshipsEqual = (
	left: ScreenRelationships,
	right: ScreenRelationships,
) =>
	left.parentScreenKey === right.parentScreenKey &&
	left.activeChildScreenKey === right.activeChildScreenKey &&
	left.activeChildNavigatorKey === right.activeChildNavigatorKey;

export const createScreenTopology = (): ScreenTopology => {
	const nodes = new Map<string, ScreenNode>();
	const screenKeyByTransitionKey = new Map<string, string>();
	const listenersByScreenKey = new Map<string, Set<() => void>>();
	const resolutionListeners = new Set<() => void>();
	const relationshipCache = new Map<string, ScreenRelationships>();

	const getNode = (screenKey: string) => nodes.get(screenKey);
	const ensureNode = (screenKey: string) => {
		const existing = getNode(screenKey);
		if (existing) return existing;

		const node: ScreenNode = {
			registered: false,
			navigatorKey: null,
			parentScreenKey: null,
			activeChildScreenKeys: [],
			transitionKey: null,
		};
		nodes.set(screenKey, node);
		return node;
	};

	const removeNodeIfEmpty = (screenKey: string) => {
		const node = getNode(screenKey);
		if (
			node &&
			!node.registered &&
			!node.parentScreenKey &&
			node.activeChildScreenKeys.length === 0
		) {
			nodes.delete(screenKey);
		}
	};

	const getParent = (screenKey: string) =>
		getNode(screenKey)?.parentScreenKey ?? null;
	const getActiveChild = (screenKey: string) => {
		const children = getNode(screenKey)?.activeChildScreenKeys;
		return children?.[children.length - 1] ?? null;
	};

	const materializeRelationships = (screenKey: string): ScreenRelationships => {
		const parentScreenKey = getParent(screenKey);
		const activeChildScreenKey = getActiveChild(screenKey);
		const activeChildNavigatorKey = activeChildScreenKey
			? (getNode(activeChildScreenKey)?.navigatorKey ?? null)
			: null;

		if (!parentScreenKey && !activeChildScreenKey) return EMPTY_RELATIONSHIPS;

		return {
			parentScreenKey,
			activeChildScreenKey,
			activeChildNavigatorKey,
		};
	};

	const getRelationships = (screenKey: string) => {
		const cached = relationshipCache.get(screenKey);
		if (cached) return cached;
		const relationships = materializeRelationships(screenKey);
		relationshipCache.set(screenKey, relationships);
		return relationships;
	};

	const mutate = (affectedScreenKeys: Set<string>, mutation: () => void) => {
		const previousRelationships = new Map<string, ScreenRelationships>();
		for (const screenKey of affectedScreenKeys) {
			if (listenersByScreenKey.has(screenKey)) {
				previousRelationships.set(screenKey, getRelationships(screenKey));
			}
		}

		mutation();
		for (const screenKey of affectedScreenKeys) {
			relationshipCache.delete(screenKey);
		}

		for (const [screenKey, previous] of previousRelationships) {
			const next = getRelationships(screenKey);
			if (areRelationshipsEqual(previous, next)) {
				relationshipCache.set(screenKey, previous);
				continue;
			}
			for (const listener of listenersByScreenKey.get(screenKey) ?? []) {
				listener();
			}
		}

		for (const listener of resolutionListeners) listener();
	};

	const register = ({
		screenKey,
		navigatorKey,
		parentScreenKey,
		transitionKey,
	}: ScreenTopologyRegistration) => {
		const transitionKeyOwner = transitionKey
			? screenKeyByTransitionKey.get(transitionKey)
			: undefined;
		if (transitionKeyOwner && transitionKeyOwner !== screenKey) {
			throw new Error(
				`Transition key "${transitionKey}" is already registered by screen "${transitionKeyOwner}".`,
			);
		}

		mutate(new Set([screenKey]), () => {
			const node = ensureNode(screenKey);
			if (
				node.transitionKey &&
				node.transitionKey !== transitionKey &&
				screenKeyByTransitionKey.get(node.transitionKey) === screenKey
			) {
				screenKeyByTransitionKey.delete(node.transitionKey);
			}

			node.registered = true;
			node.navigatorKey = navigatorKey ?? null;
			node.parentScreenKey = parentScreenKey ?? null;
			node.transitionKey = transitionKey ?? null;
			if (transitionKey) screenKeyByTransitionKey.set(transitionKey, screenKey);
		});
	};

	const unregister = (screenKey: string) => {
		const node = getNode(screenKey);
		if (!node) return;
		const affectedScreenKeys = new Set([screenKey]);
		if (node.parentScreenKey) affectedScreenKeys.add(node.parentScreenKey);

		mutate(affectedScreenKeys, () => {
			if (
				node.transitionKey &&
				screenKeyByTransitionKey.get(node.transitionKey) === screenKey
			) {
				screenKeyByTransitionKey.delete(node.transitionKey);
			}

			if (node.parentScreenKey) {
				const parent = getNode(node.parentScreenKey);
				if (parent) {
					parent.activeChildScreenKeys = parent.activeChildScreenKeys.filter(
						(childScreenKey) => childScreenKey !== screenKey,
					);
				}
				removeNodeIfEmpty(node.parentScreenKey);
			}
			nodes.delete(screenKey);
		});
	};

	const activate = ({
		screenKey,
		parentScreenKey,
	}: ActiveScreenRegistration) => {
		if (getParent(screenKey) !== parentScreenKey) {
			throw new Error(
				"Screen topology can only activate a direct containment child.",
			);
		}

		mutate(new Set([parentScreenKey]), () => {
			const parent = ensureNode(parentScreenKey);
			// A closing screen remains the active owner until it unmounts.
			if (parent.activeChildScreenKeys.includes(screenKey)) return;
			parent.activeChildScreenKeys.push(screenKey);
		});
	};

	const resolve = (screenKey: string, depth: number) => {
		if (!Number.isInteger(depth)) return null;

		let resolvedScreenKey: string | null = screenKey;
		for (let step = 0; step < Math.abs(depth); step += 1) {
			resolvedScreenKey =
				depth < 0
					? getParent(resolvedScreenKey)
					: getActiveChild(resolvedScreenKey);
			if (!resolvedScreenKey) return null;
		}

		return getNode(resolvedScreenKey)?.registered ? resolvedScreenKey : null;
	};

	return {
		register,
		unregister,
		activate,
		getRelationships,
		resolve,
		resolveTransitionKey: (key) => {
			const screenKey = screenKeyByTransitionKey.get(key) ?? key;
			return getNode(screenKey)?.registered ? screenKey : null;
		},
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
		subscribeResolution: (listener) => {
			resolutionListeners.add(listener);
			return () => resolutionListeners.delete(listener);
		},
	};
};

export const screenTopology = createScreenTopology();
