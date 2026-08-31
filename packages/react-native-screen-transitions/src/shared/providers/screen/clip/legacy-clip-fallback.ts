import type { SmoothClipPresentation } from "react-native-smooth-clip-view";
import type { LegacyClipProjectionResult } from "./legacy-clip-projector";

/**
 * The renderer selected for one deprecated geometric-mask participant.
 *
 * `overflow` is deliberately latched until the slot epoch ends so a transient
 * unsupported frame cannot swap the native subtree between two clippers.
 */
export type LegacyClipRenderMode = "smooth" | "overflow" | "unclipped";

export type LegacyClipRenderState = Readonly<{
	mode: LegacyClipRenderMode;
	overflowLatched: boolean;
}>;

export const INITIAL_LEGACY_CLIP_RENDER_STATE: LegacyClipRenderState = {
	mode: "smooth",
	overflowLatched: false,
};

export const resolveLegacyClipRenderState = ({
	current,
	projection,
	slotPresent,
}: Readonly<{
	current: LegacyClipRenderState;
	projection: LegacyClipProjectionResult;
	slotPresent: boolean;
}>): LegacyClipRenderState => {
	"worklet";
	if (!slotPresent || projection.kind === "reset") {
		return INITIAL_LEGACY_CLIP_RENDER_STATE;
	}

	// The explicit whole-object channel is authoritative. A valid explicit clip
	// may immediately recover a participant that previously needed RN overflow.
	if (projection.kind === "clip" && projection.source === "explicit") {
		return INITIAL_LEGACY_CLIP_RENDER_STATE;
	}

	// An invalid explicit presentation rejects the atomic batch. It must not
	// silently opt into a different renderer or clear an existing fallback.
	if (
		projection.kind === "fallback" &&
		projection.reason === "invalid-explicit-clip"
	) {
		return current;
	}

	// Alpha semantics are a render-safety override: never approximate them with
	// overflow. They do not clear a prior geometric latch, though, so overflow
	// resumes if the alpha property disappears before the slot epoch ends.
	if (projection.kind === "unclipped") {
		return { mode: "unclipped", overflowLatched: current.overflowLatched };
	}
	if (projection.kind === "fallback") {
		return { mode: "overflow", overflowLatched: true };
	}
	if (current.overflowLatched) {
		return { mode: "overflow", overflowLatched: true };
	}
	return INITIAL_LEGACY_CLIP_RENDER_STATE;
};

/**
 * Produces the atomic style for the RN overflow carrier. `display: contents`
 * removes the carrier's layout/clipping box in SmoothClip and unclipped modes,
 * which also prevents stale animated style keys from surviving a mode change.
 */
export const resolveLegacyOverflowCarrierStyle = (
	mode: LegacyClipRenderMode,
	style: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> => {
	"worklet";
	if (mode !== "overflow") return { display: "contents" };

	const resolved: Record<string, unknown> = {};
	if (style !== undefined) {
		const keys = Object.keys(style);
		for (let index = 0; index < keys.length; index += 1) {
			const key = keys[index];
			if (key !== undefined) resolved[key] = style[key];
		}
	}
	resolved.display = style?.display ?? "flex";
	resolved.overflow = "hidden";
	return resolved;
};

/** SmoothClip must be a full-footprint pass-through whenever RN owns clipping. */
export const selectLegacySmoothClipPresentation = (
	base: SmoothClipPresentation,
	projection: LegacyClipProjectionResult,
	renderState: LegacyClipRenderState,
): SmoothClipPresentation => {
	"worklet";
	return projection.kind === "clip" && renderState.mode === "smooth"
		? projection.presentation
		: base;
};
