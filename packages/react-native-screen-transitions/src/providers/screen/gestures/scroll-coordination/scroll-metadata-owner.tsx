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
	useScrollMetadataOwnerStore: useMaybeScrollMetadataOwnerStore,
} = createProvider("ScrollMetadataOwner", { guarded: false })<
	ScrollMetadataOwnerProviderProps,
	ScrollMetadataOwnerContextValue
>(({ children, value }) => ({ children, value }));

export const useScrollMetadataOwnerStore = () =>
	useMaybeScrollMetadataOwnerStore() ?? DEFAULT_SCROLL_METADATA_OWNER_CONTEXT;

export const useScrollMetadataOwnerProviderValue = (
	axis: ScrollGestureAxis,
) => {
	const parent = useScrollMetadataOwnerStore();

	return useMemo(() => {
		if (parent[axis]) return parent;

		return {
			...parent,
			[axis]: true,
		};
	}, [axis, parent]);
};

export { ScrollMetadataOwnerProvider };
