import { createContext, useContext } from "react";
import type { BaseStackDescriptor, BaseStackScene } from "../../types";

export type ScreenTransitionsAdapterScene =
	BaseStackScene<BaseStackDescriptor> & {
		previousDescriptor?: BaseStackDescriptor;
		nextDescriptor?: BaseStackDescriptor;
	};

export interface ScreenTransitionsAdapterContextValue {
	routeIndexByKey: ReadonlyMap<string, number>;
	scenes: ScreenTransitionsAdapterScene[];
}

const ScreenTransitionsAdapterContext =
	createContext<ScreenTransitionsAdapterContextValue | null>(null);

ScreenTransitionsAdapterContext.displayName = "ScreenTransitionsAdapter";

export function ScreenTransitionsAdapterProvider({
	children,
	value,
}: {
	children: React.ReactNode;
	value: ScreenTransitionsAdapterContextValue;
}) {
	return (
		<ScreenTransitionsAdapterContext.Provider value={value}>
			{children}
		</ScreenTransitionsAdapterContext.Provider>
	);
}

export function useScreenTransitionsAdapterContext() {
	const context = useContext(ScreenTransitionsAdapterContext);
	if (!context) {
		throw new Error(
			"useScreenTransitionsAdapterContext must be used within withScreenTransitions",
		);
	}
	return context;
}
