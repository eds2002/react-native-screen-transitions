import { useMemo } from "react";
import {
	useBuilderStore,
	useOptionalBuilderStore,
} from "../../../providers/builder";
import { useAncestorScreenKeys } from "../../../providers/builder/topology";
import type { ScreenPairKey } from "../../../stores/bounds";

export type OpeningScreen = {
	/** The screen whose transition opens this one (itself, or the ancestor that carries it). */
	screenKey: string;
	/** That transition's pair (its previous screen to it); none when nothing opens this screen. */
	destinationPairKey: ScreenPairKey | undefined;
	/** Whether that transition has an interpolator. */
	hasConfiguredInterpolator: boolean;
	/** Whether a boundary here can be a pair's destination now (opened, and nothing covers it). */
	receiving: boolean;
};

/**
 * The transition that opens this screen. A screen with a previous screen in its own stack is opened
 * by its own transition. The first screen of a nested stack never animates itself: the stack's screen
 * in the stack above opens it (and that one may be the first of its own, up the tree), so its
 * boundaries are that transition's destination. Anything covering a screen on the way up (a next
 * screen) means it is not receiving.
 */
export function useOpeningScreen(): OpeningScreen {
	const own = useBuilderStore((s) => s.derivations);
	const ancestorKeys = useAncestorScreenKeys(own.currentScreenKey);
	// Only read while the chain is made of first screens (no previous of their own).
	const ancestors = useOptionalBuilderStore(
		own.previousScreenKey ? EMPTY : ancestorKeys,
		(s) => s.derivations,
	);
	return useMemo(() => {
		const chain = [own, ...ancestors];
		for (const derivations of chain) {
			if (!derivations || derivations.nextScreenKey) break;
			if (derivations.previousScreenKey) {
				return {
					screenKey: derivations.currentScreenKey,
					destinationPairKey: derivations.destinationPairKey,
					hasConfiguredInterpolator: derivations.hasConfiguredInterpolator,
					receiving: !!derivations.destinationPairKey,
				};
			}
		}
		return {
			screenKey: own.currentScreenKey,
			destinationPairKey: own.destinationPairKey,
			hasConfiguredInterpolator: own.hasConfiguredInterpolator,
			receiving: false,
		};
	}, [own, ancestors]);
}

const EMPTY: readonly string[] = [];
