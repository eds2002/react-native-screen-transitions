import { BoundStore, type MeasuredEntry } from "../../../stores/bounds";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import type { BoundsLink } from "../../../types/bounds.types";
import type { BoundId } from "../types/options";

type GetProps = () => Omit<ScreenInterpolationProps, "bounds">;

export type LinkAccessor = {
	getMeasured: (tag: BoundId, key?: string) => MeasuredEntry | null;
	getSnapshot: (tag: BoundId, key?: string) => MeasuredEntry | null;
	getLink: (tag: BoundId) => BoundsLink | null;
};

export const createLinkAccessor = (getProps: GetProps): LinkAccessor => {
	"worklet";

	const getMeasured = (tag: BoundId, key?: string): MeasuredEntry | null => {
		"worklet";
		if (!key) return null;
		return BoundStore.entry.getMeasured(String(tag), key);
	};

	const getSnapshot = (tag: BoundId, key?: string): MeasuredEntry | null => {
		"worklet";
		return getMeasured(tag, key);
	};

	const getLink = (tag: BoundId): BoundsLink | null => {
		"worklet";
		const props = getProps();
		const link = BoundStore.link.getActive(
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
		getMeasured,
		getSnapshot,
		getLink,
	};
};
