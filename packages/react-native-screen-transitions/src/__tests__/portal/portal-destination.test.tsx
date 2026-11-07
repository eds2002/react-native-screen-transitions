import { createModuleMock } from "../helpers/mock-module";
import { beforeEach, expect, it } from "bun:test";
import { act, create } from "react-test-renderer";
import { makeMutable } from "react-native-reanimated";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const {createLocalMeasurementRef, writeLocalMeasurement} = await import("../../components/boundary/utils/local-measurements");
const localMeasurement = createLocalMeasurementRef(201);
writeLocalMeasurement(localMeasurement, {pairKey:"a<>b"} as any);
const boundaryPresentation = makeMutable<any>({owner:{pairKey:"a<>b",ready:true},receiver:"b",slots:{photo:{props:{opacity:0.5,pointerEvents:"none",handoffTarget:"destination"}}}});
const root = {currentScreenKey:"a",escapeMeasured:true,localMeasurement,portalHostReady:makeMutable(false),slotsMap:makeMutable({}),boundaryPresentation};
let hostReady = false;
let registeredScope: string | undefined;
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("../../components/boundary/providers/boundary-root.provider", () => ({useBoundaryRootStore:(select:any)=>select(root)}));
await mockModule("../../components/boundary/portal/hooks/use-active-portal-boundary-host", () => ({useActivePortalBoundaryHost:({escapeHostKey,portalHostReady}:any)=>{registeredScope=escapeHostKey;portalHostReady.set(hostReady);return escapeHostKey ? "overlay-photo" : null;}}));
const {usePortalDestination} = await import("../../components/boundary/portal/hooks/use-portal-destination");
beforeEach(()=>{hostReady=false;registeredScope=undefined;root.escapeMeasured=true;writeLocalMeasurement(localMeasurement, {pairKey:"a<>b"} as any);});

it("registers no overlay host for a boundary never measured for a transition", () => {
 root.escapeMeasured=false;
 let destination: ReturnType<typeof usePortalDestination>;
 function Probe(){destination=usePortalDestination("photo","escapeClipping");return destination.teleportDriver;}
 let renderer: ReturnType<typeof create>;
 act(()=>{renderer=create(<Probe/>);});
 expect(registeredScope).toBeUndefined();
 expect(destination!.pinned).toBe(false);
 // It renders inline as a plain portal: no animated props, nothing running on the UI thread.
 expect(destination!.teleportDriver).toBeNull();
 expect(destination!.teleportProps).toBeUndefined();
 act(()=>renderer!.unmount());
});

it("routes handoff content without registering or waiting for an overlay host", () => {
 let destination: ReturnType<typeof usePortalDestination>;
 function Probe(){destination=usePortalDestination("photo","handoff");return destination.teleportDriver;}
 let renderer: ReturnType<typeof create>;
 act(()=>{renderer=create(<Probe/>);});
 expect(registeredScope).toBeUndefined();
 expect(destination!.teleportProps).toEqual({opacity:0.5,hostName:"b-photo-content-portal-host"});
 expect(destination!.localHostName).toBe("a-photo-content-portal-host");
 act(()=>renderer!.unmount());
});

it("keeps an escaped frame inline until its host is ready and it is measured for its pair", () => {
 let destination: ReturnType<typeof usePortalDestination>;
 function Probe(){destination=usePortalDestination("photo","escapeClipping");return destination.teleportDriver;}
 let renderer: ReturnType<typeof create>;
 act(()=>{renderer=create(<Probe/>);});
 expect(registeredScope).toBe("a");
 expect(destination!.teleportProps?.hostName).toBeNull();
 // The test stand-in computes animated props on render (the real ones follow their shared values on
 // the UI thread): remount to read them again.
 hostReady=true;
 act(()=>renderer!.update(<Probe key="ready"/>));
 expect(destination!.teleportProps).toEqual({opacity:0.5,hostName:"overlay-photo"});
 // Measured since for another pair (a chain's next hop): the pair it was measured for keeps it.
 writeLocalMeasurement(localMeasurement, {pairKey:"a<>c"} as any);
 act(()=>renderer!.update(<Probe key="other-pair"/>));
 expect(destination!.teleportProps?.hostName).toBe("overlay-photo");
 // A pair it was never measured for does not.
 const owner = boundaryPresentation.get().owner;
 boundaryPresentation.set({...boundaryPresentation.get(),owner:{pairKey:"a<>d",ready:true}});
 act(()=>renderer!.update(<Probe key="unmeasured-pair"/>));
 expect(destination!.teleportProps?.hostName).toBeNull();
 boundaryPresentation.set({...boundaryPresentation.get(),owner});
 act(()=>renderer!.unmount());
});
