import { createContext, useContext } from "react";
import type { ScrollGestureAxis } from "../../../../types/gesture.types";

/** A transition-aware scrollable that contains the current view. */
export type ScrollChainLink = { id: string; axis: ScrollGestureAxis };

const EMPTY_SCROLL_CHAIN: readonly ScrollChainLink[] = [];

const ScrollChainContext =
	createContext<readonly ScrollChainLink[]>(EMPTY_SCROLL_CHAIN);

/**
 * The transition-aware scrollables around a view, outermost first. A Boundary records their offsets
 * when it is measured, so a transition can follow it however deeply it is nested.
 */
export const ScrollChainProvider = ScrollChainContext.Provider;

export const useScrollChain = () => useContext(ScrollChainContext);
