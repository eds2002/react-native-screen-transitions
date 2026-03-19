type KeyRecord = Record<string, true>;
type SlotRecord = Record<string, any>;

const IDENTITY_TRANSFORM = [
	{ translateX: 0 },
	{ translateY: 0 },
	{ scaleX: 1 },
	{ scaleY: 1 },
] as const;

const ALWAYS_RESET_STYLE_VALUES = {
	zIndex: 0,
	elevation: 0,
} as const;

const hasAnyKeys = (record: Record<string, unknown>) => {
	"worklet";
	for (const _key in record) {
		return true;
	}
	return false;
};

const collectKeys = (
	record: Record<string, unknown> | undefined,
): {
	keys: KeyRecord;
	hasAny: boolean;
} => {
	"worklet";
	const keys: KeyRecord = {};
	let hasAny = false;

	if (!record) {
		return { keys, hasAny };
	}

	for (const key in record) {
		keys[key] = true;
		hasAny = true;
	}

	return { keys, hasAny };
};

const buildStyleUnsetPatch = ({
	previousKeys,
	currentKeys,
	shouldDeferUnset,
}: {
	previousKeys: KeyRecord;
	currentKeys: KeyRecord;
	shouldDeferUnset: boolean;
}) => {
	"worklet";
	const unsetPatch: SlotRecord = {};

	for (const key in previousKeys) {
		if (currentKeys[key]) continue;
		const shouldAlwaysUnset = key in ALWAYS_RESET_STYLE_VALUES;
		if (shouldDeferUnset && !shouldAlwaysUnset) continue;

		if (key === "transform") {
			unsetPatch.transform = IDENTITY_TRANSFORM;
		} else if (key in ALWAYS_RESET_STYLE_VALUES) {
			unsetPatch[key] =
				ALWAYS_RESET_STYLE_VALUES[
					key as keyof typeof ALWAYS_RESET_STYLE_VALUES
				];
		} else {
			unsetPatch[key] = undefined;
		}
	}

	return unsetPatch;
};

const buildPropsUnsetPatch = ({
	previousKeys,
	currentKeys,
	shouldDeferUnset,
}: {
	previousKeys: KeyRecord;
	currentKeys: KeyRecord;
	shouldDeferUnset: boolean;
}) => {
	"worklet";
	const unsetPatch: SlotRecord = {};

	for (const key in previousKeys) {
		if (currentKeys[key] || shouldDeferUnset) continue;
		unsetPatch[key] = undefined;
	}

	return unsetPatch;
};

type ReconcileRootSlotEntryParams = {
	current: SlotRecord | undefined;
	previousKeys: KeyRecord;
	lastResolved: SlotRecord | null;
	isTransitionInFlight: boolean;
	kind: "style" | "props";
};

type ReconcileRootSlotEntryResult = {
	value: SlotRecord;
	hasValue: boolean;
	nextKeys: KeyRecord;
	nextLastResolved: SlotRecord | null;
};

const EMPTY_OBJECT = {};

function reconcileRootSlotEntry({
	current,
	previousKeys,
	lastResolved,
	isTransitionInFlight,
	kind,
}: ReconcileRootSlotEntryParams): ReconcileRootSlotEntryResult {
	"worklet";
	const base = current ?? EMPTY_OBJECT;
	const { keys: currentKeys, hasAny: hasCurrentKeys } = collectKeys(base);
	const hasPersistedResolved = !!lastResolved;
	const shouldHoldLastResolved =
		isTransitionInFlight && !hasCurrentKeys && hasPersistedResolved;
	const resolvedBase = shouldHoldLastResolved ? lastResolved : base;
	const shouldDeferUnset = isTransitionInFlight;

	const unsetPatch =
		kind === "style"
			? buildStyleUnsetPatch({
					previousKeys,
					currentKeys,
					shouldDeferUnset,
				})
			: buildPropsUnsetPatch({
					previousKeys,
					currentKeys,
					shouldDeferUnset,
				});

	const value = { ...unsetPatch, ...resolvedBase };
	const nextKeys = shouldDeferUnset
		? { ...previousKeys, ...currentKeys }
		: currentKeys;
	const nextLastResolved = hasCurrentKeys
		? base
		: isTransitionInFlight
			? lastResolved
			: null;

	return {
		value,
		hasValue: hasAnyKeys(value),
		nextKeys,
		nextLastResolved,
	};
}

export const reconcileRootSlotStyle = (
	params: Omit<ReconcileRootSlotEntryParams, "kind">,
) => {
	return reconcileRootSlotEntry({ ...params, kind: "style" });
};

export const reconcileRootSlotProps = (
	params: Omit<ReconcileRootSlotEntryParams, "kind">,
) => {
	return reconcileRootSlotEntry({ ...params, kind: "props" });
};
