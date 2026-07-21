import { useCallback, useEffect, useRef } from "react";

export default function useStableCallback<C extends (...args: any[]) => any>(
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
