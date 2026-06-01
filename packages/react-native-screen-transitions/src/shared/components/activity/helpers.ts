import { IS_WEB } from "../../constants";
import type { InactiveBehavior } from "../../types/screen.types";

export type { InactiveBehavior } from "../../types/screen.types";

export const DEFAULT_INACTIVE_BEHAVIOR: InactiveBehavior = IS_WEB
	? "unmount"
	: "detach";
