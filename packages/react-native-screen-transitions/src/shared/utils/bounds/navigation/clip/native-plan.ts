import type { NAVIGATION_MASK_ELEMENT_STYLE_ID } from "../../../../constants";

export type BuiltInClipPlanSlot =
	| "content"
	| typeof NAVIGATION_MASK_ELEMENT_STYLE_ID;

export type BuiltInClipPlanParticipant = Readonly<{
	slotId: BuiltInClipPlanSlot;
	/** A physical participant that joins the group only when the host renders it. */
	optional?: boolean;
	geometry: "uniform-corners";
	curve: "circular" | "continuous" | "option";
	ownsContentTranslation: boolean;
	ownsContentScale: boolean;
	/** Visual channels that remain on the Reanimated outer carrier. */
	residualChannels: readonly ("rotation" | "opacity")[];
	/** Residual channels that must be static/identity before native promotion. */
	promotionBlockers: readonly ("rotation" | "nonuniform-scale" | "matrix")[];
}>;

export type BuiltInClipNativePlanMetadata = Readonly<{
	id: "zoom" | "reveal";
	trusted: true;
	projectionSpace: "output";
	requiresReadyFixedHost: true;
	requiresStableInputs: true;
	participants: readonly BuiltInClipPlanParticipant[];
}>;

export function defineBuiltInClipNativePlan(
	plan: BuiltInClipNativePlanMetadata,
): BuiltInClipNativePlanMetadata {
	const participants = plan.participants.map((participant) =>
		Object.freeze({
			...participant,
			residualChannels: Object.freeze([...participant.residualChannels]),
			promotionBlockers: Object.freeze([...participant.promotionBlockers]),
		}),
	);

	return Object.freeze({
		...plan,
		participants: Object.freeze(participants),
	});
}
