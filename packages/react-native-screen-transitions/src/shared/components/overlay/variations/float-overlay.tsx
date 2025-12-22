import { useMemo } from "react";
import { useStack } from "../../../hooks/navigation/use-stack";
import { KeysProvider } from "../../../providers/screen/keys.provider";
import { ScreenStylesProvider } from "../../../providers/screen/styles.provider";
import { getActiveFloatOverlay } from "../helpers/get-active-overlay";
import { OverlayHost } from "./overlay-host";

/**
 * Float overlay component that renders above all screens.
 * Gets routes and descriptors from stack context.
 */
export function FloatOverlay() {
	const { scenes, focusedIndex, flags } = useStack();

	const activeOverlay = useMemo(
		() =>
			getActiveFloatOverlay(scenes, focusedIndex, flags.TRANSITIONS_ALWAYS_ON),
		[scenes, focusedIndex, flags.TRANSITIONS_ALWAYS_ON],
	);

	if (!activeOverlay) {
		return null;
	}

	const { scene, overlayIndex } = activeOverlay;

	const previous = scenes[overlayIndex - 1]?.descriptor;
	const current = scene.descriptor;
	const next = scenes[overlayIndex + 1]?.descriptor;

	return (
		<KeysProvider current={current} previous={previous} next={next}>
			<ScreenStylesProvider>
				<OverlayHost scene={scene} />
			</ScreenStylesProvider>
		</KeysProvider>
	);
}
