import { createModuleMock } from "../helpers/mock-module";
import { beforeEach, expect, it } from "bun:test";

type Bounds = { x: number; y: number; pageX: number; pageY: number; width: number; height: number };
type Mutable = { get: () => any; set: (next: any) => void; version: number };
type Reaction = { prepare: () => any; react: (value: any) => void; inputs: Map<Mutable, number> | null };
let collecting: Map<Mutable, number> | null = null;
const mutable = (initial: any): Mutable => {
 let value = initial;
 const shared: Mutable = {
  version: 0,
  get: () => { collecting?.set(shared, shared.version); return value; },
  set: (next) => { if (!Object.is(value, next)) { value = next; shared.version++; } },
 };
 return shared;
};
let measurements = 0;
let retries = 0;
let result: Bounds | null;
let cursor = 0;
let values: Mutable[] = [];
let reactions: Reaction[] = [];
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("react-native-reanimated", () => ({
 makeMutable: mutable,
 useSharedValue: (value: any) => values[cursor++] ?? (values[cursor - 1] = mutable(value)),
 useAnimatedRef: () => ({}),
 useAnimatedReaction: (prepare: Reaction["prepare"], react: Reaction["react"]) => { reactions.push({prepare, react, inputs: null}); },
 measure: () => { measurements++; return result; },
 cancelAnimation: () => {},
 withDelay: (_: number, value: any) => { retries++; return value; },
 withTiming: (value: any) => value,
}));
const {useHostMeasurement} = await import("../../components/boundary/portal/hooks/use-host-measurement");
const sourceMap = mutable({});
// A boundary's entry in the shared measurement map: set its capture (or clear it) by replacing the map.
const source = { key: 1, map: sourceMap };
const setSource = (capture: any) => sourceMap.set(capture ? { 1: capture } : {});
const render = (enabled = true) => {
 cursor = 0;
 reactions = [];
 return useHostMeasurement({enabled, boundaryMeasurements: [source]});
};
const tick = () => {
 for (const reaction of reactions) {
  if (reaction.inputs && [...reaction.inputs].every(([input, version]) => input.version === version)) continue;
  collecting = new Map();
  const value = reaction.prepare();
  reaction.inputs = collecting;
  collecting = null;
  reaction.react(value);
 }
};
const settle = () => { for (let i = 0; i < 100; i++) tick(); };
const bounds = (pageY = 0): Bounds => ({x:0, y:0, pageX:0, pageY, width:402, height:874});
beforeEach(() => {
 measurements = 0; retries = 0; values = []; reactions = []; cursor = 0; collecting = null;
 setSource({bounds: {}, pairKey: "a<>b"});
 result = bounds();
});

it("holds a stable transition snapshot without measuring every frame", () => {
 const host = render();
 settle();
 result = bounds(-180);
 settle();
 expect(host.hostBounds.get()?.pageY).toBe(0);
 expect(measurements).toBe(1);
 expect(retries).toBe(0);
});

it("measures fresh after scrolling and recapturing the same pair", () => {
 const host = render();
 settle();
 result = bounds(-180);
 setSource({bounds: {}, pairKey: "a<>b"});
 settle();
 expect(host.hostBounds.get()?.pageY).toBe(-180);
 expect(measurements).toBe(2);
});

it("waits for source capture instead of measuring an initially offscreen host", () => {
 setSource(null);
 result = bounds(1800);
 const host = render();
 settle();
 expect(measurements).toBe(0);
 expect(host.hostBounds.get()).toBeNull();
 result = bounds(63);
 setSource({bounds: {}, pairKey:"a<>b"});
 settle();
 expect(host.hostBounds.get()?.pageY).toBe(63);
 expect(measurements).toBe(1);
});

for (const invalid of [null, {...bounds(), width:0, height:0}]) {
 it(`bounds retries when the host is ${invalid ? "zero-sized" : "missing"}`, () => {
  result = invalid;
  const host = render();
  settle();
  expect(host.hostBounds.get()).toBeNull();
  // It retries (each retry measures again), then gives up: settling again measures nothing more.
  expect(retries).toBeGreaterThan(1);
  expect(measurements).toBe(retries + 1);
  const spent = measurements;
  settle();
  expect(measurements).toBe(spent);
 });
}

it("discards old bounds on a failed fresh capture and gives the next capture fresh retries", () => {
 const host = render();
 settle();
 result = null;
 setSource({bounds:{}, pairKey:"a<>c"});
 settle();
 expect(host.hostBounds.get()).toBeNull();
 expect(measurements).toBe(21);
 result = bounds(-120);
 setSource({bounds:{}, pairKey:"a<>c"});
 settle();
 expect(host.hostBounds.get()?.pageY).toBe(-120);
 expect(measurements).toBe(22);
});

it("stops retries as soon as the host can be measured", () => {
 result = null;
 const host = render();
 tick();
 const before = measurements;
 result = bounds(24);
 settle();
 expect(measurements).toBe(before + 1);
 expect(host.hostBounds.get()?.pageY).toBe(24);
});

it("clears the snapshot and stops pending retries when disabled", () => {
 result = null;
 render();
 tick();
 const before = measurements;
 const host = render(false);
 settle();
 expect(measurements).toBe(before);
 expect(host.hostBounds.get()).toBeNull();
});

it("measures fresh when re-enabled even if the source capture is unchanged", () => {
 render();
 settle();
 render(false);
 settle();
 result = bounds(120);
 const host = render();
 settle();
 expect(host.hostBounds.get()?.pageY).toBe(120);
 expect(measurements).toBe(2);
});

for (const offset of [1689, -1689]) {
 it(`normalizes the native visibility offset ${offset} before escape placement`, () => {
  result = {...bounds(offset), width:390, height:844};
  const host = render();
  settle();
  expect(host.hostBounds.get()?.pageY).toBe(0);
  expect(measurements).toBe(1);
 });
}
