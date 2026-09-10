import { describe, expect, it } from "bun:test";
import { canActivateHandoffReceiver } from "../../components/boundary/portal/components/boundary-content-portal/helpers/handoff-visibility";

describe("handoff receiver visibility", () => {
	const opening = {
		returningFromActiveClose: false,
		activatingPairDestination: true,
		animationProgress: 0.01,
		receiverIsActiveDestination: true,
		destinationVisibilityBlocked: true,
	};
	it("retains the source while the linked destination is hidden", () => {
		expect(canActivateHandoffReceiver(opening)).toBe(false);
		expect(
			canActivateHandoffReceiver({
				...opening,
				destinationVisibilityBlocked: false,
			}),
		).toBe(true);
	});
	it("does not return content to an unregistered destination", () => {
		expect(
			canActivateHandoffReceiver({
				...opening,
				destinationVisibilityBlocked: undefined,
			}),
		).toBe(false);
	});
	it("preserves close completion returning to the source", () => {
		expect(
			canActivateHandoffReceiver({
				...opening,
				returningFromActiveClose: true,
				receiverIsActiveDestination: false,
				animationProgress: 0,
			}),
		).toBe(true);
	});
	it("preserves early close handback to the source", () => {
		expect(
			canActivateHandoffReceiver({
				...opening,
				receiverIsActiveDestination: false,
				activatingPairDestination: false,
				animationProgress: 0.2,
			}),
		).toBe(true);
	});
	it("does not start a visible but unready destination", () => {
		expect(
			canActivateHandoffReceiver({
				...opening,
				destinationVisibilityBlocked: false,
				activatingPairDestination: false,
				animationProgress: 0,
			}),
		).toBe(false);
	});
});
