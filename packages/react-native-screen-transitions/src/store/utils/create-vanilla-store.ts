import { type Draft, produce } from "immer";
import { useSyncExternalStore } from "react";

type Listener = () => void;
type StateUpdater<T> = (draft: Draft<T>) => void;

type StoreListener<_, TSelectorOutput> = (
	selectedState: TSelectorOutput,
	previousSelectedState: TSelectorOutput,
) => void;

export interface StoreApi<T> {
	setState: (updater: StateUpdater<T>) => void;
	getState: () => T;
	subscribe: (listener: Listener) => () => void;
	subscribeWithSelector: <TSelectorOutput>(
		selector: (state: T) => TSelectorOutput,
		listener: StoreListener<T, TSelectorOutput>,
	) => () => void;
}

export function createVanillaStore<TState>(initialState: TState) {
	let state: TState = initialState;
	const listeners = new Set<Listener>();

	const getState = (): TState => state;

	const setState = (updater: StateUpdater<TState>) => {
		const nextState = produce(state, updater);

		if (nextState !== state) {
			state = nextState;
			listeners.forEach((listener) => listener());
		}
	};

	const subscribe = (listener: Listener): (() => void) => {
		listeners.add(listener);
		return () => listeners.delete(listener);
	};

	const subscribeWithSelector = <TSelectorOutput>(
		selector: (state: TState) => TSelectorOutput,
		listener: StoreListener<TState, TSelectorOutput>,
	) => {
		let previousSelectedState = selector(state);

		const internalListener = () => {
			const currentSelectedState = selector(getState());

			if (!Object.is(previousSelectedState, currentSelectedState)) {
				listener(currentSelectedState, previousSelectedState);
				previousSelectedState = currentSelectedState;
			}
		};

		const unsubscribe = subscribe(internalListener);

		listener(previousSelectedState, previousSelectedState);

		return unsubscribe;
	};

	function useStore<TSelectorOutput>(
		selector: (state: TState) => TSelectorOutput,
	): TSelectorOutput {
		return useSyncExternalStore(subscribe, () => selector(getState()));
	}

	Object.assign(useStore, {
		setState,
		getState,
		subscribe,
		subscribeWithSelector,
	});

	return useStore as typeof useStore & StoreApi<TState>;
}
