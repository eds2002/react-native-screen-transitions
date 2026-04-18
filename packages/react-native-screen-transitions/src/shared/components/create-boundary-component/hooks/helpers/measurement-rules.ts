import type { MeasureIntent } from "../../types";

export type MeasureIntentFlags = {
	captureSource: boolean;
	completeDestination: boolean;
	refreshSource: boolean;
	refreshDestination: boolean;
};

export type MeasureWritePlan = {
	captureSource: boolean;
	completeDestination: boolean;
	refreshSource: boolean;
	refreshDestination: boolean;
	writesAny: boolean;
	wantsDestinationWrite: boolean;
};

export const getMeasureIntentFlags = (
	intent?: MeasureIntent | readonly MeasureIntent[],
): MeasureIntentFlags => {
	"worklet";
	const flags: MeasureIntentFlags = {
		captureSource: false,
		completeDestination: false,
		refreshSource: false,
		refreshDestination: false,
	};

	if (!intent) {
		return flags;
	}

	const intents = Array.isArray(intent) ? intent : [intent];

	for (let i = 0; i < intents.length; i++) {
		switch (intents[i]) {
			case "capture-source":
				flags.captureSource = true;
				break;
			case "complete-destination":
				flags.completeDestination = true;
				break;
			case "refresh-source":
				flags.refreshSource = true;
				break;
			case "refresh-destination":
				flags.refreshDestination = true;
				break;
		}
	}

	return flags;
};

export const resolveMeasureWritePlan = (params: {
	intents: MeasureIntentFlags;
	hasPendingLink: boolean;
	hasSourceLink: boolean;
	hasDestinationLink: boolean;
	hasAttachableSourceLink: boolean;
}): MeasureWritePlan => {
	"worklet";
	const {
		intents,
		hasPendingLink,
		hasSourceLink,
		hasDestinationLink,
		hasAttachableSourceLink,
	} = params;

	const captureSource = intents.captureSource;
	const completeDestination =
		intents.completeDestination && (hasPendingLink || hasAttachableSourceLink);
	const refreshSource = intents.refreshSource && hasSourceLink;
	const refreshDestination =
		intents.refreshDestination &&
		(hasDestinationLink || hasPendingLink || hasAttachableSourceLink);
	const writesAny =
		captureSource || completeDestination || refreshSource || refreshDestination;

	return {
		captureSource,
		completeDestination,
		refreshSource,
		refreshDestination,
		writesAny,
		wantsDestinationWrite: completeDestination || refreshDestination,
	};
};
