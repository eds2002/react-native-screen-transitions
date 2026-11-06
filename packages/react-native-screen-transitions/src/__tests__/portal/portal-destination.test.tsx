import { createModuleMock } from "../helpers/mock-module";
import { beforeEach, expect, it } from "bun:test";
import { act, create } from "react-test-renderer";
import { makeMutable } from "react-native-reanimated";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const localMeasurement = makeMutable<any>({pairKey:"a<>b"});
const boundaryPresentation = makeMutable<any>({owner:{pairKey:"a<>b",ready:true},receiver:"b",slots:{photo:{props:{opacity:0.5,pointerEvents:"none",handoffTarget:"destination"}}}});
const root = {currentScreenKey:"a",escapeMeasured:true,localMeasurement,portalHostReady:makeMutable(false),slotsMap:makeMutable({}),boundaryPresentation};
let hostReady = false;
let registeredScope: string | undefined;
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("../../components/boundary/providers/boundary-root.provider", () => ({useBoundaryRootStore:(select:any)=>select(root)}));
await mockModule("../../components/boundary/portal/stores/host-registry.store", () => ({useActiveHostKey:(screen:string|null)=>screen ? "overlay" : undefined}));
await mockModule("../../components/boundary/portal/hooks/use-active-portal-boundary-host", () => ({useActivePortalBoundaryHost:({escapeHostKey,portalHostReady}:any)=>{registeredScope=escapeHostKey;portalHostReady.set(hostReady);return escapeHostKey ? "overlay-photo" : null;}}));
const {usePortalDestination} = await import("../../components/boundary/portal/hooks/use-portal-destination");
beforeEach(()=>{hostReady=false;registeredScope=undefined;root.escapeMeasured=true;localMeasurement.set({pairKey:"a<>b"});});

it("registers no overlay host for a boundary never measured for a transition", () => {
 root.escapeMeasured=false;
 let destination: ReturnType<typeof usePortalDestination>;
 function Probe(){destination=usePortalDestination("photo","escapeClipping");return null;}
 let renderer: ReturnType<typeof create>;
 act(()=>{renderer=create(<Probe/>);});
 expect(registeredScope).toBeUndefined();
 expect(destination!.pinned).toBe(false);
 expect(destination!.teleportProps.hostName).toBeNull();
 act(()=>renderer!.unmount());
});

it("routes handoff content without registering or waiting for an overlay host", () => {
 let destination: ReturnType<typeof usePortalDestination>;
 function Probe(){destination=usePortalDestination("photo","handoff");return null;}
 let renderer: ReturnType<typeof create>;
 act(()=>{renderer=create(<Probe/>);});
 expect(registeredScope).toBeUndefined();
 expect(destination!.teleportProps).toEqual({opacity:0.5,hostName:"b-photo-content-portal-host"});
 expect(destination!.localHostName).toBe("a-photo-content-portal-host");
 act(()=>renderer!.unmount());
});

it("keeps an escaped frame inline until its host and matching pair are ready", () => {
 let destination: ReturnType<typeof usePortalDestination>;
 function Probe(){destination=usePortalDestination("photo","escapeClipping");return null;}
 let renderer: ReturnType<typeof create>;
 act(()=>{renderer=create(<Probe/>);});
 expect(registeredScope).toBe("overlay");
 expect(destination!.teleportProps.hostName).toBeNull();
 hostReady=true;
 act(()=>renderer!.update(<Probe/>));
 expect(destination!.teleportProps).toEqual({opacity:0.5,hostName:"overlay-photo"});
 localMeasurement.set({pairKey:"a<>c"});
 act(()=>renderer!.update(<Probe/>));
 expect(destination!.teleportProps.hostName).toBeNull();
 act(()=>renderer!.unmount());
});
