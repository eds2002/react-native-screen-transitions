import {
	getPendingLink,
	hasDestinationLink,
	hasSourceLink,
} from "../../../../stores/bounds/internals/registry";
import { resolvePendingSourceKey } from "../../helpers/resolve-pending-source-key";

export type LinkContext = {
	/**
	 * The source screen this measurement should pair with, if one can be
	 * resolved. Disambiguates between multiple candidate sources in the
	 * registry (e.g. nested or repeat presentations of the same tag).
	 */
	expectedSourceScreenKey: string | undefined;
	/** A pending link exists waiting for a destination to attach. */
	hasPendingLink: boolean;
	/** The expected source screen has a captured source ready to attach to. */
	hasAttachableSourceLink: boolean;
	/** The current screen is already registered as the source for this tag. */
	hasSourceLink: boolean;
	/** The current screen is already registered as the destination for this tag. */
	hasDestinationLink: boolean;
};

export const createLinkContext = (params: {
	sharedBoundTag: string;
	currentScreenKey: string;
	preferredSourceScreenKey?: string;
}): LinkContext => {
	"worklet";
	const { sharedBoundTag, currentScreenKey, preferredSourceScreenKey } = params;

	const expectedSourceScreenKey =
		resolvePendingSourceKey(sharedBoundTag, preferredSourceScreenKey) ??
		undefined;
	const hasPendingLink =
		getPendingLink(sharedBoundTag, expectedSourceScreenKey) !== null;

	return {
		expectedSourceScreenKey,
		hasPendingLink,
		hasAttachableSourceLink: expectedSourceScreenKey
			? hasSourceLink(sharedBoundTag, expectedSourceScreenKey)
			: false,
		hasSourceLink: hasSourceLink(sharedBoundTag, currentScreenKey),
		hasDestinationLink: hasDestinationLink(sharedBoundTag, currentScreenKey),
	};
};
