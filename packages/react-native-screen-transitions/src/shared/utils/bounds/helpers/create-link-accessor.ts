import { getResolvedLink } from "../../../stores/bounds/internals/links";
import type {
	BoundsInterpolationProps,
	BoundsLink,
} from "../../../types/bounds.types";
import type { BoundId } from "../types/options";
import { resolveBoundsPairKey } from "./resolve-bounds-pair-key";

type GetProps = () => BoundsInterpolationProps;
type ResolvedLinkSide = NonNullable<
	ReturnType<typeof getResolvedLink>["link"]
>["source"];

export type LinkAccessor = {
	getLink: (tag: BoundId) => BoundsLink | null;
};

const createPublicLinkSide = (
	side: ResolvedLinkSide,
	initialSide: ResolvedLinkSide | undefined,
) => {
	"worklet";
	if (!side) return null;

	return {
		bounds: side.bounds,
		initialBounds: initialSide?.bounds ?? side.bounds,
		styles: side.styles,
	};
};

export const createLinkAccessor = (getProps: GetProps): LinkAccessor => {
	"worklet";

	const getLink = (tag: BoundId): BoundsLink | null => {
		"worklet";
		const props = getProps();
		const stringTag = String(tag);
		const pairKey = resolveBoundsPairKey(props);
		const resolved = pairKey
			? getResolvedLink(pairKey, stringTag)
			: { tag: stringTag, link: null };
		const selectedTag = resolved.tag;
		const link = resolved.link;

		if (!link) return null;

		const source = createPublicLinkSide(link.source, link.initialSource);
		const destination = createPublicLinkSide(
			link.destination,
			link.initialDestination,
		);

		if (!source) {
			return {
				id: selectedTag,
				status: "source-incomplete",
				source,
				destination,
			};
		}

		if (!destination) {
			return {
				id: selectedTag,
				status: "destination-incomplete",
				source,
				destination,
			};
		}

		return {
			id: selectedTag,
			status: "complete",
			source,
			destination,
		};
	};

	return {
		getLink,
	};
};
