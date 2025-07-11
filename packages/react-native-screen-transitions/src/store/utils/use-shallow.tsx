/**
 * NOTICE:
 * Taken from zustand/react/shallow.ts
 * @link https://github.com/pmndrs/zustand/blob/main/src/react/shallow.ts
 */
import React from "react";
import { shallow } from "./shallow";

export function useShallow<S, U>(selector: (state: S) => U): (state: S) => U {
	const prev = React.useRef<U>(undefined);
	return (state) => {
		const next = selector(state);

		if (shallow(prev.current, next)) {
			return prev.current as U;
		}

		prev.current = next;
		return next;
	};
}
