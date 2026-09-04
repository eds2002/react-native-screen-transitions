import { useMemo } from "react";
import { useBlankStackStore } from "../../providers/stack/blank-stack.provider";
import type { BlankStackStoreValue } from "../../types/providers/blank-stack-provider.types";

export type BlankStackState = Pick<
	BlankStackStoreValue,
	"focusedIndex" | "routeKeys" | "routes" | "scenes"
>;

/**
 * Reads the durable scene state produced by Blank Stack without prescribing
 * how those scenes are presented.
 */
export const useBlankStackState = (): BlankStackState => {
	const focusedIndex = useBlankStackStore((store) => store.focusedIndex);
	const routeKeys = useBlankStackStore((store) => store.routeKeys);
	const routes = useBlankStackStore((store) => store.routes);
	const scenes = useBlankStackStore((store) => store.scenes);

	return useMemo(
		() => ({ focusedIndex, routeKeys, routes, scenes }),
		[focusedIndex, routeKeys, routes, scenes],
	);
};
