import { describe, expect, it } from "bun:test";
import { normalizeSlots } from "../../providers/screen/orchestrator/styles/helpers/normalize-slots";
import { resolveSlotStyles, reuseEqualResolvedSlots } from "../../providers/screen/orchestrator/styles/helpers/resolve-slot-styles";

const clip = { x: 80, y: 120, width: 140, height: 200, borderRadius: 24 };

describe("clip slot", () => {
 it("normalizes and compares geometry through the ordinary style bucket", () => {
  const previous = normalizeSlots({ clip });
  expect(previous.clip).toEqual({ style: clip });
  expect(reuseEqualResolvedSlots({ resolvedStylesMap: normalizeSlots({ clip: { ...clip } }), previousResolvedStylesMap: previous })).toBe(previous);
  expect(reuseEqualResolvedSlots({ resolvedStylesMap: normalizeSlots({ clip: { ...clip, x: 90 } }), previousResolvedStylesMap: previous }).clip?.style?.x).toBe(90);
 });
 it("reserves clipping to the local screen and drops dimensions when omitted", () => {
  const first = resolveSlotStyles({ localStylesMaps: [normalizeSlots({ clip })], ancestorStylesMap: {}, previousStyleStatesBySlot: {} });
  const next = resolveSlotStyles({ localStylesMaps: [{}], ancestorStylesMap: normalizeSlots({ clip }), previousStyleStatesBySlot: first.nextPreviousStyleStatesBySlot });
  expect(next.resolvedStylesMap.clip?.style?.width).toBeUndefined();
  expect(next.resolvedStylesMap.clip?.style?.height).toBeUndefined();
 });
});
