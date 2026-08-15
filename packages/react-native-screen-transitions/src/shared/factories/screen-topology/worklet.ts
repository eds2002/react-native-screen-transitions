import { makeMutable } from "react-native-reanimated";
import type { ScreenTopologyRegistration } from "./types";

type WorkletScreenNode = {
	parentScreenKey?: string;
};

type WorkletScreenTopology = Record<string, WorkletScreenNode>;

const toStorageKey = (screenKey: string) => {
	"worklet";
	return `screen:${screenKey}`;
};

const workletScreenTopology = makeMutable<WorkletScreenTopology>({});

export const registerWorkletScreen = ({
	screenKey,
	parentScreenKey,
}: ScreenTopologyRegistration) => {
	"worklet";
	workletScreenTopology.modify(
		<T extends WorkletScreenTopology>(value: T): T => {
			"worklet";
			(value as WorkletScreenTopology)[toStorageKey(screenKey)] = {
				parentScreenKey,
			};
			return value;
		},
	);
};

export const unregisterWorkletScreen = (screenKey: string) => {
	"worklet";
	workletScreenTopology.modify(
		<T extends WorkletScreenTopology>(value: T): T => {
			"worklet";
			const storageKey = toStorageKey(screenKey);
			delete value[storageKey];
			return value;
		},
	);
};

export const screenBelongsToScope = (
	screenKey: string,
	scopeScreenKey: string,
): boolean => {
	"worklet";
	if (screenKey === scopeScreenKey) return true;

	const state = workletScreenTopology.get();
	let parentScreenKey = state[toStorageKey(screenKey)]?.parentScreenKey;
	while (parentScreenKey) {
		if (parentScreenKey === scopeScreenKey) return true;
		parentScreenKey = state[toStorageKey(parentScreenKey)]?.parentScreenKey;
	}

	return false;
};
