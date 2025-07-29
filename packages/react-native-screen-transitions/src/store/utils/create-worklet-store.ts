import { makeMutable } from "react-native-reanimated";
import type { Mutable } from "react-native-reanimated/lib/typescript/commonTypes";

export interface StoreApi<T> {
	getState: () => Mutable<T>;
}

export function createWorkletStore<TState>(initialState: TState) {
	const state: Mutable<TState> = makeMutable(initialState);

	const getState = (): Mutable<TState> => {
		"worklet";
		return state;
	};

	return {
		getState,
	} satisfies StoreApi<TState>;
}
