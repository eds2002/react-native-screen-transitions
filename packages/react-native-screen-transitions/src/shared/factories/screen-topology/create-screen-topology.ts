import type {
	ActiveScreenRegistration,
	ScreenRelationships,
	ScreenTopology,
	ScreenTopologyRegistration,
} from "./types";

type ScreenNode = {
	parentScreenKey: string | null;
	activeChildScreenKeys: string[];
};

const EMPTY_RELATIONSHIPS: ScreenRelationships = {
	parentScreenKey: null,
	activeChildScreenKey: null,
};

const areRelationshipsEqual = (
	left: ScreenRelationships,
	right: ScreenRelationships,
): boolean =>
	left.parentScreenKey === right.parentScreenKey &&
	left.activeChildScreenKey === right.activeChildScreenKey;

export const createScreenTopology = (): ScreenTopology => {
	const nodes = new Map<string, ScreenNode>();
	const listenersByScreenKey = new Map<string, Set<() => void>>();
	const relationshipCache = new Map<string, ScreenRelationships>();

	const getNode = (screenKey: string) => nodes.get(screenKey);
	const ensureNode = (screenKey: string) => {
		const existing = getNode(screenKey);
		if (existing) return existing;

		const node: ScreenNode = {
			parentScreenKey: null,
			activeChildScreenKeys: [],
		};
		nodes.set(screenKey, node);
		return node;
	};

	const removeNodeIfEmpty = (screenKey: string) => {
		const node = getNode(screenKey);
		if (
			node &&
			!node.parentScreenKey &&
			node.activeChildScreenKeys.length === 0
		) {
			nodes.delete(screenKey);
		}
	};

	const getParent = (screenKey: string) =>
		getNode(screenKey)?.parentScreenKey ?? null;

	const getActiveChild = (screenKey: string) => {
		const activeChildScreenKeys = getNode(screenKey)?.activeChildScreenKeys;
		return activeChildScreenKeys?.[activeChildScreenKeys.length - 1] ?? null;
	};

	const materializeRelationships = (screenKey: string): ScreenRelationships => {
		const parentScreenKey = getParent(screenKey);
		const activeChildScreenKey = getActiveChild(screenKey);

		if (!parentScreenKey && !activeChildScreenKey) {
			return EMPTY_RELATIONSHIPS;
		}

		return { parentScreenKey, activeChildScreenKey };
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
			const listeners = listenersByScreenKey.get(screenKey);
			if (!listeners) continue;

			const next = getRelationships(screenKey);
			if (areRelationshipsEqual(previous, next)) {
				relationshipCache.set(screenKey, previous);
				continue;
			}

			for (const listener of listeners) listener();
		}
	};

	const register = ({
		screenKey,
		parentScreenKey,
	}: ScreenTopologyRegistration) => {
		mutate(new Set([screenKey]), () => {
			ensureNode(screenKey).parentScreenKey = parentScreenKey ?? null;
		});
	};

	const unregister = (screenKey: string) => {
		const node = getNode(screenKey);
		if (!node) return;

		const affectedScreenKeys = new Set([screenKey]);
		if (node.parentScreenKey) {
			affectedScreenKeys.add(node.parentScreenKey);
		}

		mutate(affectedScreenKeys, () => {
			if (node.parentScreenKey) {
				const parent = getNode(node.parentScreenKey);
				if (parent) {
					parent.activeChildScreenKeys = parent.activeChildScreenKeys.filter(
						(activeScreenKey) => activeScreenKey !== screenKey,
					);
				}
				removeNodeIfEmpty(node.parentScreenKey);
			}

			nodes.delete(screenKey);
		});
	};

	const activate = (registration: ActiveScreenRegistration) => {
		if (getParent(registration.screenKey) !== registration.parentScreenKey) {
			throw new Error(
				"Screen topology can only activate a direct containment child.",
			);
		}

		const affectedScreenKeys = new Set([registration.parentScreenKey]);
		mutate(affectedScreenKeys, () => {
			const parent = ensureNode(registration.parentScreenKey);
			parent.activeChildScreenKeys = [
				...parent.activeChildScreenKeys.filter(
					(screenKey) => screenKey !== registration.screenKey,
				),
				registration.screenKey,
			];
		});

		return () => {
			const parent = getNode(registration.parentScreenKey);
			if (!parent?.activeChildScreenKeys.includes(registration.screenKey)) {
				return;
			}

			mutate(affectedScreenKeys, () => {
				parent.activeChildScreenKeys = parent.activeChildScreenKeys.filter(
					(screenKey) => screenKey !== registration.screenKey,
				);
				removeNodeIfEmpty(registration.parentScreenKey);
			});
		};
	};

	return {
		register,
		unregister,
		activate,
		getRelationships,
		subscribe: (screenKey, listener) => {
			const listeners =
				listenersByScreenKey.get(screenKey) ?? new Set<() => void>();
			listeners.add(listener);
			listenersByScreenKey.set(screenKey, listeners);

			return () => {
				listeners.delete(listener);
				if (listeners.size === 0) {
					listenersByScreenKey.delete(screenKey);
					if (!getNode(screenKey)) {
						relationshipCache.delete(screenKey);
					}
				}
			};
		},
	};
};

export const screenTopology = createScreenTopology();
