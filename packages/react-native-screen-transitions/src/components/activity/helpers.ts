import { IS_WEB } from "../../constants";
import type { InactiveBehavior } from "../../types/screen.types";
import type { StackSceneActivity } from "../../types/stack.types";

export type { InactiveBehavior } from "../../types/screen.types";

export const DEFAULT_INACTIVE_BEHAVIOR: InactiveBehavior = IS_WEB
	? "unmount"
	: "hide";

type ActivityState = 0 | 1 | 2;

const ActivityStateByActivity = {
	active: 2,
	inert: 1,
	inactive: 0,
	closing: 1,
} satisfies Record<StackSceneActivity, ActivityState>;

const PointerEventsByActivity = {
	active: "auto",
	inert: "auto",
	inactive: "none",
	closing: "none",
} as const satisfies Record<StackSceneActivity, "auto" | "none">;

export const HIDDEN_ACTIVITY_SCREEN_STYLE = { display: "none" } as const;

export function resolveActivityScreenPresentation({
	activity,
	inactiveBehavior,
	waitForPaintDriver,
}: {
	activity: StackSceneActivity;
	inactiveBehavior: InactiveBehavior;
	waitForPaintDriver: boolean;
}) {
	let activityState: ActivityState = ActivityStateByActivity[activity];
	let shouldFreeze = false;
	let visible = activity !== "inactive";

	if (activity === "inactive") {
		if (inactiveBehavior === "keep") {
			activityState = 1;
			visible = true;
		} else if (waitForPaintDriver) {
			activityState = 1;
			visible = true;
		} else if (inactiveBehavior === "pause") {
			activityState = 1;
			shouldFreeze = true;
			visible = true;
		} else {
			activityState = 0;
			shouldFreeze = true;
			visible = false;
		}
	}

	return {
		activityState,
		freezeOnBlur: true,
		pointerEvents: PointerEventsByActivity[activity],
		shouldFreeze,
		visible,
	};
}
