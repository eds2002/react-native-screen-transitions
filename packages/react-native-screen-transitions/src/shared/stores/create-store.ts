import type { ScreenKey } from "../types/screen.types";

interface CreateStoreOptions<TBag> {
	createBag: () => TBag;
	disposeBag: (bag: TBag) => void;
}

export function createStore<TBag>({
	createBag,
	disposeBag,
}: CreateStoreOptions<TBag>) {
	const store: Record<ScreenKey, TBag> = {};

	function peekBag(routeKey: ScreenKey): TBag | undefined {
		return store[routeKey];
	}

	function getBag(routeKey: ScreenKey): TBag {
		let bag = store[routeKey];
		if (!bag) {
			bag = createBag();
			store[routeKey] = bag;
		}
		return bag;
	}

	function getValue<K extends keyof TBag>(
		routeKey: ScreenKey,
		key: K,
	): TBag[K] {
		return getBag(routeKey)[key];
	}

	function getBaseBag(): TBag {
		return createBag();
	}

	function clearBag(routeKey: ScreenKey) {
		const bag = store[routeKey];
		if (bag) {
			disposeBag(bag);
		}
		delete store[routeKey];
	}

	return {
		peekBag,
		getBag,
		getValue,
		getBaseBag,
		clearBag,
	};
}
