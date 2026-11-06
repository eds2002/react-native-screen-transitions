import { createModuleMock } from "../helpers/mock-module";
import { describe, expect, it } from "bun:test";
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("../../components/boundary/portal/teleport", () => ({isTeleportAvailable:true}));
const {resolveBoundaryPortal} = await import("../../components/boundary/portal/utils/resolve-portal");

describe("resolveBoundaryPortal", () => {
 it("always escapes clipping with Teleport; handoff stays opt-in; the deprecated prop is ignored", () => {
  expect(resolveBoundaryPortal({})).toEqual({handoff:false,escapeClipping:true});
  expect(resolveBoundaryPortal({handoff:true})).toEqual({handoff:true,escapeClipping:true});
  expect(resolveBoundaryPortal({escapeClipping:false})).toEqual({handoff:false,escapeClipping:true});
  expect(resolveBoundaryPortal({handoff:true,escapeClipping:true})).toEqual({handoff:true,escapeClipping:true});
 });
});
