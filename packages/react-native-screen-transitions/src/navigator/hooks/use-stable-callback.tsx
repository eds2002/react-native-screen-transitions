import { useCallback, useEffect, useRef } from "react";
import type { Any } from "../../types/utils";

export default function useStableCallback<C extends (...args: Any[]) => any>(
	callback: C,
) {
	const callbackRef = useRef(callback);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	return useCallback((...args: Parameters<C>) => {
		callbackRef.current(...args);
	}, []);
}
