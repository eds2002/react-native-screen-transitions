import type { ScreenKey } from "../types/screen.types";

export interface StoreApi<TBag> {
	peekBag(routeKey: ScreenKey): TBag | undefined;
	getBag(routeKey: ScreenKey): TBag;
	getValue<K extends keyof TBag>(routeKey: ScreenKey, key: K): TBag[K];
	getCachedBag(): TBag;
	clearBag(routeKey: ScreenKey): void;
}

interface CreateStoreOptions<TBag, THelpers extends object = {}> {
	createBag: () => TBag;
	disposeBag: (bag: TBag & THelpers) => void;
	helpers?: (bag: TBag) => THelpers;
}

export function createStore<TBag, THelpers extends object = {}>({
	createBag,
	disposeBag,
	helpers: createHelpers,
}: CreateStoreOptions<TBag, THelpers>): StoreApi<TBag & THelpers> {
	const store: Record<ScreenKey, TBag & THelpers> = {};
	let cachedBag: (TBag & THelpers) | undefined;

	function createFullBag(): TBag & THelpers {
		const bag = createBag();
		const helpers = createHelpers?.(bag) ?? ({} as THelpers);
		return Object.assign({}, bag, helpers);
	}

	function peekBag(routeKey: ScreenKey): (TBag & THelpers) | undefined {
		return store[routeKey];
	}

	function getBag(routeKey: ScreenKey): TBag & THelpers {
		let bag = store[routeKey];
		if (!bag) {
			bag = createFullBag();
			store[routeKey] = bag;
		}
		return bag;
	}

	function getValue<K extends keyof (TBag & THelpers)>(
		routeKey: ScreenKey,
		key: K,
	): (TBag & THelpers)[K] {
		return getBag(routeKey)[key];
	}

	/**
	 * Returns a lazily-created singleton bag that is not keyed to a route. This is
	 * useful for stable fallback state, such as neutral gesture values for screens
	 * that should not own live route-specific state.
	 */
	function getCachedBag(): TBag & THelpers {
		if (!cachedBag) {
			cachedBag = createFullBag();
		}
		return cachedBag;
	}

	function clearBag(routeKey: ScreenKey) {
		const bag = store[routeKey];
		if (bag) {
			disposeBag(bag);
		}
		delete store[routeKey];
	}

	const baseStore: StoreApi<TBag & THelpers> = {
		peekBag,
		getBag,
		getValue,
		getCachedBag,
		clearBag,
	};
	return baseStore;
}
