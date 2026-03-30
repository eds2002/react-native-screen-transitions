import type { MeasurementIntent } from "../../types";

type PresenceLikeEntry = {
	count: number;
	ancestorKeys?: string[];
};

export type MeasurementIntentFlags = {
	captureSource: boolean;
	completeDestination: boolean;
	refreshSource: boolean;
	refreshDestination: boolean;
};

export type MeasurementWritePlan = {
	captureSource: boolean;
	completeDestination: boolean;
	refreshSource: boolean;
	refreshDestination: boolean;
	writesAny: boolean;
	wantsDestinationWrite: boolean;
};

export type DeferredMeasurementAction =
	| "clear-pending"
	| "queue-or-flush"
	| "noop";

export const getMeasurementIntentFlags = (
	intent?: MeasurementIntent | readonly MeasurementIntent[],
): MeasurementIntentFlags => {
	"worklet";
	const flags: MeasurementIntentFlags = {
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

export const resolveMeasurementWritePlan = (params: {
	intents: MeasurementIntentFlags;
	hasPendingLink: boolean;
	hasSourceLink: boolean;
	hasDestinationLink: boolean;
	hasAttachableSourceLink: boolean;
}): MeasurementWritePlan => {
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

/**
 * Temporarily removed destination-match gating for auto source capture.
 *
 * For now, any enabled boundary on a source screen will eagerly capture when a
 * next screen exists, even if no matching destination boundary has registered
 * presence yet. The previous behavior waited for an explicit destination match
 * before allowing source capture.
 */
export const resolveAutoSourceCaptureSignal = (params: {
	enabled: boolean;
	nextScreenKey?: string;
	tagPresence?: Record<string, PresenceLikeEntry>;
}): string | 0 => {
	"worklet";
	const { enabled, nextScreenKey } = params;
	if (!enabled) return 0;
	if (!nextScreenKey) return 0;

	/**
	 * Temporarily removed destination-match gating for auto source capture.
	 *
	 * For now, any enabled boundary on a source screen will eagerly capture when
	 * a next screen exists, even if no matching destination boundary has
	 * registered presence yet. The previous behavior waited for an explicit
	 * destination match before allowing source capture.
	 */
	// const tagPresence = params.tagPresence;
	// if (!tagPresence) return 0;
	//
	// const direct = tagPresence[nextScreenKey];
	// if (direct && direct.count > 0) return nextScreenKey;
	//
	// for (const screenKey in tagPresence) {
	// 	const entry = tagPresence[screenKey];
	// 	if (entry.ancestorKeys?.includes(nextScreenKey)) {
	// 		return nextScreenKey;
	// 	}
	// }
	//
	// return 0;

	return nextScreenKey;
};

export const resolvePendingDestinationCaptureSignal = (params: {
	enabled: boolean;
	resolvedSourceKey?: string | null;
	hasAttachableSourceLink: boolean;
	hasDestinationLink: boolean;
}): string | 0 => {
	"worklet";
	const {
		enabled,
		resolvedSourceKey,
		hasAttachableSourceLink,
		hasDestinationLink,
	} = params;
	if (!enabled) return 0;
	if (!resolvedSourceKey) return 0;
	if (!hasAttachableSourceLink) return 0;
	if (hasDestinationLink) return 0;
	return resolvedSourceKey;
};

export const resolvePendingDestinationRetrySignal = (params: {
	enabled: boolean;
	retryCount: number;
	maxRetries: number;
	isAnimating: boolean;
	hasDestinationLink: boolean;
	progress: number;
	retryProgressMax: number;
	retryProgressBuckets: number;
	resolvedSourceKey?: string | null;
	hasAttachableSourceLink: boolean;
}): number => {
	"worklet";
	const {
		enabled,
		retryCount,
		maxRetries,
		isAnimating,
		hasDestinationLink,
		progress,
		retryProgressMax,
		retryProgressBuckets,
		resolvedSourceKey,
		hasAttachableSourceLink,
	} = params;

	if (!enabled) return 0;
	if (retryCount >= maxRetries) return 0;
	if (!isAnimating) return 0;
	if (hasDestinationLink) return 0;
	if (progress <= 0 || progress >= retryProgressMax) return 0;
	if (!resolvedSourceKey) return 0;
	if (!hasAttachableSourceLink) return 0;

	return Math.floor(progress * retryProgressBuckets) + 1;
};

export const resolvePrepareSourceMeasurementIntent = (params: {
	hasSourceLink: boolean;
	shouldRefreshExistingSource: boolean;
}): MeasurementIntent | null => {
	"worklet";
	if (!params.hasSourceLink) {
		return "capture-source";
	}

	return params.shouldRefreshExistingSource ? "refresh-source" : null;
};

export const PREPARE_DESTINATION_MEASUREMENT_INTENT = [
	"complete-destination",
	"refresh-destination",
] as const satisfies readonly MeasurementIntent[];

export const resolveGroupActiveMeasurementAction = (params: {
	enabled: boolean;
	isEligible: boolean;
	memberId: string;
	activeId: string | null;
	previousActiveId: string | null;
}): DeferredMeasurementAction => {
	"worklet";
	const { enabled, isEligible, memberId, activeId, previousActiveId } = params;

	if (!enabled || !isEligible) return "noop";
	if (activeId !== memberId) return "clear-pending";
	if (activeId === memberId && activeId !== previousActiveId) {
		return "queue-or-flush";
	}
	return "noop";
};

export const canFlushGroupActiveMeasurement = (params: {
	enabled: boolean;
	isEligible: boolean;
	memberId: string;
	activeId: string | null;
}): boolean => {
	"worklet";
	const { enabled, isEligible, memberId, activeId } = params;
	if (!enabled || !isEligible) return false;
	return activeId === memberId;
};

export const shouldTriggerScrollSettledRefresh = (params: {
	enabled: boolean;
	group: string | undefined;
	hasNextScreen: boolean;
	hasSettledSignal: boolean;
	signal: number;
	previousSignal: number | null;
}): boolean => {
	"worklet";
	const {
		enabled,
		group,
		hasNextScreen,
		hasSettledSignal,
		signal,
		previousSignal,
	} = params;

	if (!enabled) return false;
	if (!group || !hasNextScreen || !hasSettledSignal) return false;
	if (signal === 0 || signal === previousSignal) return false;
	return true;
};
