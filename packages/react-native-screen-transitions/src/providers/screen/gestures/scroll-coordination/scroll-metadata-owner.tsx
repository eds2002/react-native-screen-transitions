import { type ReactNode, useMemo } from "react";
import createProvider from "../../../../utils/create-provider";
import type { ScrollGestureAxis } from "../types";

type ScrollMetadataOwnerContextValue = Record<ScrollGestureAxis, boolean>;

interface ScrollMetadataOwnerProviderProps {
	children: ReactNode;
	value: ScrollMetadataOwnerContextValue;
}

const DEFAULT_SCROLL_METADATA_OWNER_CONTEXT: ScrollMetadataOwnerContextValue = {
	vertical: false,
	horizontal: false,
};

const {
	ScrollMetadataOwnerProvider,
	useScrollMetadataOwnerContext: useMaybeScrollMetadataOwnerContext,
} = createProvider("ScrollMetadataOwner", { guarded: false })<
	ScrollMetadataOwnerProviderProps,
	ScrollMetadataOwnerContextValue
>(({ children, value }) => ({ children, value }));

export const useScrollMetadataOwnerContext = () =>
	useMaybeScrollMetadataOwnerContext() ?? DEFAULT_SCROLL_METADATA_OWNER_CONTEXT;

export const useScrollMetadataOwnerProviderValue = (
	axis: ScrollGestureAxis,
) => {
	const parent = useScrollMetadataOwnerContext();

	return useMemo(() => {
		if (parent[axis]) return parent;

		return {
			...parent,
			[axis]: true,
		};
	}, [axis, parent]);
};

export { ScrollMetadataOwnerProvider };
