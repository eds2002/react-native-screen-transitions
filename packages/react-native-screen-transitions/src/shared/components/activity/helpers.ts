import { IS_WEB } from "../../constants";

export type InactiveBehavior = "keep" | "freeze" | "detach" | "unmount";
export const DEFAULT_INACTIVE_BEHAVIOR: InactiveBehavior = IS_WEB
	? "unmount"
	: "detach";
