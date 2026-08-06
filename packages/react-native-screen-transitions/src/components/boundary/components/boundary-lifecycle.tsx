import { memo } from "react";
import type { View } from "react-native";
import type { AnimatedRef } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import type { BoundTag } from "../../../stores/bounds/types";
import { useBoundaryMeasurement } from "../hooks/use-boundary-measurement";
import type { BoundaryConfigProps } from "../types";

interface BoundaryLifecycleProps {
	boundTag: BoundTag;
	config: BoundaryConfigProps;
	currentScreenKey: string;
	enabled: boolean;
	escapeClipping: boolean;
	handoff: boolean;
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
		config,
	});

	return null;
});
