import { useCallback, useEffect, useRef } from "react";
import type { Any } from "@/types";

export default function useStableCallback<
	C extends (...args: Array<Any>) => Any,
>(callback: C) {
	const callbackRef = useRef(callback);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	return useCallback((...args: Parameters<C>) => {
		return callbackRef.current(...args);
	}, []);
}
