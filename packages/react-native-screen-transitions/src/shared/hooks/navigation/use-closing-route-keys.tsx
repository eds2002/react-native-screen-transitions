import { useMemo, useRef } from "react";
import { useSharedValue } from "react-native-reanimated";
import useStableCallback from "../use-stable-callback";

export const useClosingRouteKeys = () => {
	const keysRef = useRef<Set<string>>(new Set());
	const shared = useSharedValue<string[]>([]);

	const add = useStableCallback((key: string) => {
		const keys = keysRef.current;
		if (keys.has(key)) {
			return;
		}

		keys.add(key);
		shared.modify((prev) => {
			"worklet";
			if (!prev.includes(key)) {
				prev.push(key);
			}
			return prev;
		});
	});

	const remove = useStableCallback((key: string) => {
		const keys = keysRef.current;
		keys.delete(key);

		shared.modify((prev) => {
			"worklet";
			const index = prev.indexOf(key);
			if (index !== -1) {
				prev.splice(index, 1);
			}
			return prev;
		});
	});

	const clear = useStableCallback(() => {
		const keys = keysRef.current;

		keys.clear();
		shared.modify((prev) => {
			"worklet";
			prev.length = 0;
			return prev;
		});
	});

	return useMemo(
		() => ({
			ref: keysRef,
			shared,
			add,
			remove,
			clear,
		}),
		[shared, add, remove, clear],
	);
};
