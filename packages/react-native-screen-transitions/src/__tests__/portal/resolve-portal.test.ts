import { createModuleMock } from "../helpers/mock-module";
import { describe, expect, it } from "bun:test";
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("../../components/boundary/portal/teleport", () => ({isTeleportAvailable:true}));
const {resolveBoundaryPortal} = await import("../../components/boundary/portal/utils/resolve-portal");

describe("resolveBoundaryPortal", () => {
 it("defaults omitted flags to false and preserves either or both features", () => {
  expect(resolveBoundaryPortal({})).toEqual({handoff:false,escapeClipping:false});
  expect(resolveBoundaryPortal({handoff:true})).toEqual({handoff:true,escapeClipping:false});
  expect(resolveBoundaryPortal({escapeClipping:true})).toEqual({handoff:false,escapeClipping:true});
  expect(resolveBoundaryPortal({handoff:true,escapeClipping:true})).toEqual({handoff:true,escapeClipping:true});
 });
});
