import { useMemo } from "react";
import { KeysContext } from "../../context/keys";
import type { NativeStackDescriptor } from "../../types/navigator";

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
