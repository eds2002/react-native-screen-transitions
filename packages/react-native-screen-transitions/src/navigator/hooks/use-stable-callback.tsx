import { useCallback, useEffect, useRef } from "react";

// A callback that always closes over the latest data but keeps the same
// identity and will not be called after component unmounts

const useStableCallback = <T extends (...args: Parameters<T>) => ReturnType<T>>(
	callback: T,
) => {
	const callbackRef = useRef<T>(null);
	const memoCallback = useCallback(
		(...args: Parameters<T>) => callbackRef?.current?.(...args),
		[],
	);
	useEffect(() => {
		callbackRef.current = callback;
		return () => {
			callbackRef.current = null;
		};
	});
	return memoCallback;
};

export default useStableCallback;
