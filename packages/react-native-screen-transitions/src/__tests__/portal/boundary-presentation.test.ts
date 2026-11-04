import { resolveBoundaryHandoff as handoff } from "../../components/boundary/helpers/presentation";
import { boundaryRegistry, pairs } from "../../stores/bounds/internals/state";
import { boundarySourceFrame, runBoundaryInterpolator } from "../../providers/orchestrator/helpers/use-pair-presentation";
import type { ScreenInterpolatorFrame } from "../../providers/orchestrator/helpers/pipeline";
import { createScreenTransitionState } from "../../constants";
import { beforeEach, describe, expect, it } from "bun:test";
import { resolveBoundaryPresentation as presentation, resolveBoundaryReceiver, type BoundaryPairPresentation } from "../../components/boundary/helpers/presentation";
import { setDestination, setSource } from "../../stores/bounds/internals/links";
import { clear } from "../../stores/bounds/internals/clear";

const bounds = {x:0,y:0,pageX:0,pageY:0,width:100,height:120};
function publish(destination: string, id: string, scale: number, overrides: Partial<BoundaryPairPresentation> = {}) {
 const key = `home<>${destination}`;
 setSource(key, id, "home", bounds);
 setDestination(key, id, destination, bounds);
 const presentation = {pairKey:key,sourceKey:"home", destinationKey:destination, ready:true,
  source:{[id]:{style:{transform:[{scale}]}}}, destination:{[id]:{style:{opacity:1}}}, ...overrides};
 presentations[key] = presentation;
 return presentation;
}
let presentations: Record<string, BoundaryPairPresentation> = {};
beforeEach(() => {globalThis.resetMutableRegistry(); presentations = {};});
describe("boundary presentation ownership", () => {
 it("keeps the old photo's live styles while another photo opens", () => {
  publish("media-1", "photo-1", 0.4);
  publish("media-2", "photo-2", 0.1);
  expect(resolveBoundaryPresentation("home","photo-1")?.source["photo-1"].style?.transform).toEqual([{scale:0.4}]);
  publish("media-1", "photo-1", 0.2);
  expect(resolveBoundaryPresentation("home","photo-1")?.source["photo-1"].style?.transform).toEqual([{scale:0.2}]);
  expect(resolveBoundaryPresentation("home","photo-2")?.pairKey).toBe("home<>media-2");
 });
 it("returns the old content at the UI close endpoint while both routes remain registered", () => {
  const old = publish("media-1","photo-1",0,{ready:false});
  const next = publish("media-2","photo-2",0.2);
  expect(resolveBoundaryReceiver(old,"destination","home")).toBe("home");
  expect(resolveBoundaryReceiver(next,"destination","home")).toBe("media-2");
 });
 it("does not transfer the same photo to a destination that is not ready", () => {
  publish("media-1","photo",0.4);
  publish("media-2","photo",0,{ready:false});
  expect(resolveBoundaryPresentation("home","photo")?.pairKey).toBe("home<>media-1");
  publish("media-2","photo",0.1);
  expect(resolveBoundaryPresentation("home","photo")?.pairKey).toBe("home<>media-2");
 });
 it("does not let a finished pair displace a live pair", () => {
  publish("media-1","photo",0.4);
  publish("media-2","photo",0,{ready:false});
  expect(resolveBoundaryPresentation("home","photo")?.pairKey).toBe("home<>media-1");
 });
 it("isolates unrelated boundaries and screens", () => {
  publish("media-1","photo",0.4);
  expect(resolveBoundaryPresentation("other","photo")).toBeUndefined();
  expect(resolveBoundaryPresentation("home","other")).toBeUndefined();
 });
 it("allows explicit early source handback and cancelled close", () => {
  const presentation = publish("media-1","photo",0.4);
  expect(resolveBoundaryReceiver(presentation,"source","home")).toBe("home");
  expect(resolveBoundaryReceiver(presentation,"destination","home")).toBe("media-1");
 });
 it("keeps initial content home until the destination is visible", () => {
  const presentation = publish("media-1","photo",0,{ready:false});
  expect(resolveBoundaryReceiver(presentation,"destination","home")).toBe("home");
 });
 it("cleans up only the removed screen's presentation", () => {
  publish("media-1","photo-1",0.4);
  publish("media-2","photo-2",0.2);
  clear("media-1");
  expect(resolveBoundaryPresentation("home","photo-1")).toBeUndefined();
  expect(resolveBoundaryPresentation("home","photo-2")?.pairKey).toBe("home<>media-2");
 });
});

it("evaluates the old pair from its destination frame even after Home's next route changes", () => {
 const home = {...createScreenTransitionState({key:"home",name:"Home"}),progress:1};
 const media = {...createScreenTransitionState({key:"media-1",name:"Media"}),progress:0.4,closing:1};
 const frame: ScreenInterpolatorFrame = {
  current:media, previous:home, active:media, inactive:home, focused:true,
  progress:0.4,transitionProgress:0.4,stackProgress:1.4,layouts:media.layouts,
  insets:{top:0,left:0,right:0,bottom:0},
 };
 const source = boundarySourceFrame(frame)!;
 expect(source.current.route.key).toBe("home");
 expect(source.next?.route.key).toBe("media-1");
 expect(source.progress).toBe(1.4);
 const result = runBoundaryInterpolator(({active,focused}) => ({photo:{transform:[{scale:focused ? 1 : active.progress}]}}), source, "source");
 expect(result.photo.style?.transform).toEqual([{scale:0.4}]);
});

it("animates escapeClipping source-only navigation zoom without a handoff destination", () => {
 const presentation = publish("media-1", "photo", 0.6);
 pairs.modify(state => {
  const link = state["home<>media-1"].links.photo;
  state["home<>media-1"].links.photo = {...link,source:link.source!,destination:null,status:"destination-incomplete"};
  return state;
 });
 boundaryRegistry.set({photo:{screens:{home:{bounds,styles:{},escapeClipping:true}}}});
 expect(resolveBoundaryPresentation("home","photo")?.ready).toBe(true);
 expect(resolveBoundaryPresentation("home","photo")?.source).toEqual(presentation.source);
});

function connect(sourceKey: string, destinationKey: string, overrides: Partial<BoundaryPairPresentation> = {}) {
 const key = `${sourceKey}<>${destinationKey}`;
 setSource(key, "video", sourceKey, bounds, {}, undefined, {handoff:true});
 setDestination(key, "video", destinationKey, bounds, {}, undefined, {handoff:true});
 boundaryRegistry.modify(state => {
  const entry = state.video ??= {screens:{}};
  entry.screens[sourceKey] = {bounds,styles:{},handoff:true};
  entry.screens[destinationKey] = {bounds,styles:{},handoff:true};
  return state;
 });
 const presentation = {pairKey:key,sourceKey,destinationKey,ready:true,source:{video:{style:{opacity:1}}},destination:{video:{style:{opacity:1}}},...overrides};
 presentations[key] = presentation;
 return presentation;
}
it("relays one payload through A B C D E and returns through the same chain", () => {
 for (const [source,destination] of [["a","b"],["b","c"],["c","d"],["d","e"]]) {
  connect(source,destination);
  expect(resolveBoundaryHandoff("a","video")).toBe(destination);
 }
 for (const [source,destination] of [["d","e"],["c","d"],["b","c"],["a","b"]]) {
  connect(source,destination,{ready:false});
  expect(resolveBoundaryHandoff("a","video")).toBe(source);
  clear(destination);
  expect(resolveBoundaryHandoff("a","video")).toBe(source);
 }
});
it("keeps the payload on B while C is preparing or its receiver is absent", () => {
 connect("a","b");
 connect("b","c",{ready:false});
 expect(resolveBoundaryHandoff("a","video")).toBe("b");
 connect("b","c");
 boundaryRegistry.modify(state => {delete state.video.screens.c;return state;});
 expect(resolveBoundaryHandoff("a","video")).toBe("b");
});
it("honors early source handback without walking back into the destination", () => {
 connect("a","b",{source:{video:{props:{handoffTarget:"source"}}},destination:{video:{props:{handoffTarget:"source"}}}});
 expect(resolveBoundaryHandoff("a","video")).toBe("a");
 expect(resolveBoundaryHandoff("b","video")).toBe("a");
});

function snapshot() { return {presentations: Object.values(presentations).map(p => ({get:()=>p}) as any), pairs: pairs.get(), entries: boundaryRegistry.get()}; }
function resolveBoundaryHandoff(key: string, id: string) {return handoff(key,id,snapshot());}
function resolveBoundaryPresentation(key: string, id: string) {return presentation(key,id,snapshot());}

it("hands off container-only navigation zoom without requiring a boundary style slot", () => {
 publish("media", "photo", 1, {source: {}, destination: {content: {style: {opacity: 1}}}});
 const state = snapshot();
 state.entries.photo = {screens: {home: {handoff: true}, media: {handoff: true}}} as typeof state.entries[string];
 expect(handoff("home", "photo", state)).toBe("media");
 presentations["home<>media"].ready = false;
 expect(handoff("home", "photo", state)).toBe("home");
});
