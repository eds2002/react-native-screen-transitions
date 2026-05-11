import {
	Extrapolation,
	interpolate,
	type MeasuredDimensions,
} from "react-native-reanimated";
import { ENTER_RANGE, EXIT_RANGE } from "../../../constants";
import { getEntry } from "../../../stores/bounds/internals/entries";
import type { BoundsInterpolationProps } from "../../../types/bounds.types";
import type { BoundId } from "../types/options";
import type { LinkAccessor } from "./create-link-accessor";
import { interpolateLinkStyle } from "./styles/interpolate-link-style";

type InterpolatorParams = {
	getProps: () => BoundsInterpolationProps;
	getLink: LinkAccessor["getLink"];
};

export const createInterpolators = ({
	getProps,
	getLink,
}: InterpolatorParams) => {
	"worklet";

	const interpolateStyle = (
		tag: BoundId,
		property: string,
		fallback?: number,
	): number => {
		"worklet";
		const props = getProps();
		const link = getLink(tag);
		const entering = !props.next;
		return interpolateLinkStyle(link, property, props.progress, entering, {
			fallback,
		});
	};

	const interpolateBoundsFromMeasuredEntry = (
		tag: BoundId,
		property: keyof MeasuredDimensions,
		targetKey: string,
		fallback?: number,
	): number => {
		"worklet";

		const props = getProps();
		const entering = !props.next;
		const range = entering ? ENTER_RANGE : EXIT_RANGE;
		const currentKey = props.current?.route?.key;
		const fb = fallback ?? 0;
		const normalizedTag = String(tag);

		const currentEntry = currentKey
			? getEntry(normalizedTag, currentKey)
			: null;
		const targetEntry = getEntry(normalizedTag, targetKey);

		const currentValue = currentEntry?.bounds?.[property] ?? fb;
		const targetValue = targetEntry?.bounds?.[property] ?? fb;

		return interpolate(
			props.progress,
			range,
			[targetValue, currentValue],
			Extrapolation.CLAMP,
		);
	};

	const interpolateBoundsFromLink = (
		tag: BoundId,
		property: keyof MeasuredDimensions,
		fallback?: number,
	): number => {
		"worklet";

		const props = getProps();
		const entering = !props.next;
		const range = entering ? ENTER_RANGE : EXIT_RANGE;
		const link = getLink(tag);
		const fb = fallback ?? 0;

		const sourceValue = link?.source?.bounds?.[property] ?? fb;
		const destinationValue = link?.destination?.bounds?.[property] ?? fb;

		return interpolate(
			props.progress,
			range,
			[sourceValue, destinationValue],
			Extrapolation.CLAMP,
		);
	};

	const interpolateBounds = (
		tag: BoundId,
		property: keyof MeasuredDimensions,
		fallbackOrTargetKey?: number | string,
		fallback?: number,
	): number => {
		"worklet";

		if (typeof fallbackOrTargetKey === "string") {
			return interpolateBoundsFromMeasuredEntry(
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
