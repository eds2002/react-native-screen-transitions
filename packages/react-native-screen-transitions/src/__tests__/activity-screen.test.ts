import { describe, expect, it } from "bun:test";
import {
	HIDDEN_ACTIVITY_SCREEN_STYLE,
	resolveActivityScreenPresentation,
} from "../components/activity/helpers";

describe("ActivityScreen presentation", () => {
	it("freezes and removes settled inactive hide content from presentation", () => {
		expect(
			resolveActivityScreenPresentation({
				activity: "inactive",
				inactiveBehavior: "hide",
				waitForPaintDriver: false,
			}),
		).toEqual({
			activityState: 0,
			freezeOnBlur: true,
			pointerEvents: "none",
			shouldFreeze: true,
			visible: false,
		});
		expect(HIDDEN_ACTIVITY_SCREEN_STYLE).toEqual({ display: "none" });
	});

	it("restores native presentation and updates when the screen becomes active", () => {
		expect(
			resolveActivityScreenPresentation({
				activity: "active",
				inactiveBehavior: "hide",
				waitForPaintDriver: false,
			}),
		).toEqual({
			activityState: 2,
			freezeOnBlur: true,
			pointerEvents: "auto",
			shouldFreeze: false,
			visible: true,
		});
	});
});
