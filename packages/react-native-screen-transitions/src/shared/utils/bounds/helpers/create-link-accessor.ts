import { BoundStore, type Snapshot } from "../../../stores/bounds";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import type { BoundsLink } from "../../../types/bounds.types";
import type { BoundId } from "../types/options";

type GetProps = () => Omit<ScreenInterpolationProps, "bounds">;

export type LinkAccessor = {
	getSnapshot: (tag: BoundId, key?: string) => Snapshot | null;
	getLink: (tag: BoundId) => BoundsLink | null;
};

export const createLinkAccessor = (getProps: GetProps): LinkAccessor => {
	"worklet";

	const getSnapshot = (tag: BoundId, key?: string): Snapshot | null => {
		"worklet";
		if (!key) return null;
		return BoundStore.getSnapshot(String(tag), key);
	};

	const getLink = (tag: BoundId): BoundsLink | null => {
		"worklet";
		const props = getProps();
		const link = BoundStore.getActiveLink(
			String(tag),
			props.current?.route.key,
		);
		if (!link) return null;
		return {
			source: link.source
				? { bounds: link.source.bounds, styles: link.source.styles }
				: null,
			destination: link.destination
				? { bounds: link.destination.bounds, styles: link.destination.styles }
				: null,
		};
	};

	return {
		getSnapshot,
		getLink,
	};
};
