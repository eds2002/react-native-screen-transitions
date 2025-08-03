import { useMemo } from "react";
import type { NativeStackDescriptor } from "../../../types/navigator";
import { KeysContext } from "../../context/keys";

interface KeysProviderProps {
	children: React.ReactNode;
	previous?: NativeStackDescriptor;
	current: NativeStackDescriptor;
	next?: NativeStackDescriptor;
}

export const KeysProvider = ({
	children,
	previous,
	current,
	next,
}: KeysProviderProps) => {
	const value = useMemo(
		() => ({ previous, current, next }),
		[previous, current, next],
	);
	return <KeysContext.Provider value={value}>{children}</KeysContext.Provider>;
};
