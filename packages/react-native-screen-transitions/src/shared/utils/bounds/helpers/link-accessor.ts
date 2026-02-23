import { BoundStore, type Snapshot } from "../../../stores/bounds";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import type { BoundsLink } from "../../../types/bounds.types";

type GetProps = () => Omit<ScreenInterpolationProps, "bounds">;

export type LinkAccessor = {
	getSnapshot: (tag: string, key?: string) => Snapshot | null;
	getLink: (tag: string) => BoundsLink | null;
};

export const createLinkAccessor = (getProps: GetProps): LinkAccessor => {
	"worklet";

	const getSnapshot = (tag: string, key?: string): Snapshot | null => {
		"worklet";
		if (!key) return null;
		return BoundStore.getSnapshot(tag, key);
	};

	const getLink = (tag: string): BoundsLink | null => {
		"worklet";
		const props = getProps();
		const link = BoundStore.getActiveLink(tag, props.current?.route.key);
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
