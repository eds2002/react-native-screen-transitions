import { memo } from "react";
import type { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import type { BoundTag } from "../../../stores/bounds/types";
import { useBoundaryMeasurement } from "../hooks/use-boundary-measurement";
import type {
	BoundaryConfigProps,
	BoundaryLocalMeasurementValue,
} from "../types";

interface BoundaryLifecycleProps {
	boundTag: BoundTag;
	config: BoundaryConfigProps;
	currentScreenKey: string;
	enabled: boolean;
	escapeClipping: boolean;
	handoff: boolean;
	localMeasurement: BoundaryLocalMeasurementValue;
	measuredRef: AnimatedRef<View>;
	style?: unknown;
}

export const BoundaryLifecycle = memo(function BoundaryLifecycle({
	boundTag,
	config,
	currentScreenKey,
	enabled,
	escapeClipping,
	handoff,
	localMeasurement,
	measuredRef,
	style,
}: BoundaryLifecycleProps) {
	const hasConfiguredInterpolator = useDescriptorsStore(
		(s) => s.derivations.hasConfiguredInterpolator,
	);

	useBoundaryMeasurement({
		boundTag,
		enabled,
		runtimeEnabled: enabled && hasConfiguredInterpolator,
		currentScreenKey,
		measuredRef,
		style,
		handoff,
		escapeClipping,
		localMeasurement,
		config,
	});

	return null;
});
