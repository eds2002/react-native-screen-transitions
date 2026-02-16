import { type EventArg, StackActions } from "@react-navigation/native";
import * as React from "react";

/**
 * When inside a tab navigator, resets the stack to the first screen
 * when the already-focused tab is pressed again. Replicates native behaviour.
 */
export function useTabPressReset(
	navigation: {
		isFocused: () => boolean;
		addListener?: (event: string, callback: (e: any) => void) => () => void;
		dispatch: (action: any) => void;
	},
	stateIndex: number,
	stateKey: string,
) {
	React.useEffect(
		() =>
			navigation?.addListener?.("tabPress", (e: any) => {
				const isFocused = navigation.isFocused();

				// Run the operation in the next frame so we're sure all listeners have been run
				// This is necessary to know if preventDefault() has been called
				requestAnimationFrame(() => {
					if (
						stateIndex > 0 &&
						isFocused &&
						!(e as EventArg<"tabPress", true>).defaultPrevented
					) {
						// When user taps on already focused tab and we're inside the tab,
						// reset the stack to replicate native behaviour
						navigation.dispatch({
							...StackActions.popToTop(),
							target: stateKey,
						});
					}
				});
			}),
		[navigation, stateIndex, stateKey],
	);
}
