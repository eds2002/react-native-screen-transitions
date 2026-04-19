import type { ScreenKey } from "../types/screen.types";

type BagWithActions<TBag, TActions extends object = never> = TBag &
	([TActions] extends [never] ? {} : { actions: TActions });

export interface StoreApi<TBag> {
	peekBag(routeKey: ScreenKey): TBag | undefined;
	getBag(routeKey: ScreenKey): TBag;
	getValue<K extends keyof TBag>(routeKey: ScreenKey, key: K): TBag[K];
	getCachedBag(): TBag;
	clearBag(routeKey: ScreenKey): void;
}

interface CreateStoreOptions<TBag, TActions extends object = never> {
	createBag: () => TBag;
	disposeBag: (bag: TBag) => void;
	actions?: (bag: TBag) => TActions;
}

export function createStore<TBag, TActions extends object = never>({
	createBag,
	disposeBag,
	actions: createActions,
}: CreateStoreOptions<TBag, TActions>): StoreApi<
	BagWithActions<TBag, TActions>
> {
	const store: Record<ScreenKey, BagWithActions<TBag, TActions>> = {};
	let cachedBag: BagWithActions<TBag, TActions> | undefined;

	function createFullBag(): BagWithActions<TBag, TActions> {
		const bag = createBag();
		const actions = createActions?.(bag);
		return (
			actions ? Object.assign({}, bag, { actions }) : Object.assign({}, bag)
		) as BagWithActions<TBag, TActions>;
	}

	function peekBag(
		routeKey: ScreenKey,
	): BagWithActions<TBag, TActions> | undefined {
		return store[routeKey];
	}

	function getBag(routeKey: ScreenKey): BagWithActions<TBag, TActions> {
		let bag = store[routeKey];
		if (!bag) {
			bag = createFullBag();
			store[routeKey] = bag;
		}
		return bag;
	}

	function getValue<K extends keyof BagWithActions<TBag, TActions>>(
		routeKey: ScreenKey,
		key: K,
	): BagWithActions<TBag, TActions>[K] {
		return getBag(routeKey)[key];
	}

	/**
	 * Returns a lazily-created singleton bag that is not keyed to a route. This is
	 * useful for stable fallback state, such as neutral gesture values for screens
	 * that should not own live route-specific state.
	 */
	function getCachedBag(): BagWithActions<TBag, TActions> {
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

	const baseStore: StoreApi<BagWithActions<TBag, TActions>> = {
		peekBag,
		getBag,
		getValue,
		getCachedBag,
		clearBag,
	};
	return baseStore;
}
