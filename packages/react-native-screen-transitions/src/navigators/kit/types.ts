import type { BlankStackDescriptor } from "../../types/blank-stack.types";
import type { BlankStackProviderProps } from "../../types/providers/blank-stack-provider.types";
import type {
	BaseStackScene,
	StackSceneActivity,
} from "../../types/stack.types";

/** What a standard React Navigation navigator hands its view: state, navigation and descriptors. */
export type TransitionNavigatorProps = BlankStackProviderProps;

/**
 * One route as the engine animates it. `activity` is `"active"` for the focused scene, `"inert"` for
 * the one directly below it, `"inactive"` further down and `"closing"` for a route React Navigation
 * already removed but that is still animating out.
 */
export type TransitionScene = Readonly<BaseStackScene<BlankStackDescriptor>>;

export type TransitionSceneActivity = StackSceneActivity;

export interface TransitionNavigator {
	/** The navigator's state key. */
	readonly key: string;
	/** Every scene, bottom to top, including closing ones. */
	readonly scenes: readonly TransitionScene[];
	/** Index into `scenes` of the focused scene. */
	readonly focusedIndex: number;
	readonly focused: TransitionScene | undefined;
}
