import type { MeasuredDimensions } from "react-native-reanimated";
import { ENTER_RANGE, EXIT_RANGE } from "../../../constants";
import { BoundStore } from "../../../stores/bounds.store";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import { interpolateClamped } from "./interpolate";
import { interpolateLinkStyle } from "./interpolate-style";
import type { LinkAccessor } from "./link-accessor";

type InterpolatorParams = {
	props: Omit<ScreenInterpolationProps, "bounds">;
	getLink: LinkAccessor["getLink"];
};

export const createInterpolators = ({ props, getLink }: InterpolatorParams) => {
	"worklet";

	const interpolateStyle = (
		tag: string,
		property: string,
		fallback?: number,
	): number => {
		"worklet";
		const link = getLink(tag);
		const entering = !props.next;
		return interpolateLinkStyle(link, property, props.progress, entering, {
			fallback,
		});
	};

	const interpolateBoundsFromSnapshot = (
		tag: string,
		property: keyof MeasuredDimensions,
		targetKey: string,
		fallback?: number,
	): number => {
		"worklet";

		const entering = !props.next;
		const range = entering ? ENTER_RANGE : EXIT_RANGE;
		const currentKey = props.current?.route?.key;
		const fb = fallback ?? 0;

		const currentSnapshot = currentKey
			? BoundStore.getSnapshot(tag, currentKey)
			: null;
		const targetSnapshot = BoundStore.getSnapshot(tag, targetKey);

		const currentValue = currentSnapshot?.bounds?.[property] ?? fb;
		const targetValue = targetSnapshot?.bounds?.[property] ?? fb;

		return interpolateClamped(props.progress, range, [
			targetValue,
			currentValue,
		]);
	};

	const interpolateBoundsFromLink = (
		tag: string,
		property: keyof MeasuredDimensions,
		fallback?: number,
	): number => {
		"worklet";

		const entering = !props.next;
		const range = entering ? ENTER_RANGE : EXIT_RANGE;
		const link = getLink(tag);
		const fb = fallback ?? 0;

		const sourceValue = link?.source?.bounds?.[property] ?? fb;
		const destinationValue = link?.destination?.bounds?.[property] ?? fb;

		return interpolateClamped(props.progress, range, [
			sourceValue,
			destinationValue,
		]);
	};

	const interpolateBounds = (
		tag: string,
		property: keyof MeasuredDimensions,
		fallbackOrTargetKey?: number | string,
		fallback?: number,
	): number => {
		"worklet";

		if (typeof fallbackOrTargetKey === "string") {
			return interpolateBoundsFromSnapshot(
				tag,
				property,
				fallbackOrTargetKey,
				fallback,
			);
		}

		return interpolateBoundsFromLink(tag, property, fallbackOrTargetKey);
	};

	return {
		interpolateStyle,
		interpolateBounds,
	};
};
