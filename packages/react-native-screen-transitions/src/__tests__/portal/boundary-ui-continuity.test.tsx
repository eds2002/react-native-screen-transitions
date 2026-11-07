import { createModuleMock } from "../helpers/mock-module";
import { expect, it } from "bun:test";
import { act, create } from "react-test-renderer";
import { makeMutable } from "react-native-reanimated";
import { createScreenTransitionState } from "../../constants";
import { setSource, setDestination } from "../../stores/bounds/internals/links";
import { boundaryRegistry } from "../../stores/bounds/internals/state";

const keys = ["a", "b", "c"];
const scenes = keys.map(key => ({route: {key}}));
const states = keys.map(key => ({...createScreenTransitionState({key, name:key}), progress: 1}));
const frames = states.map((current,i) => makeMutable({current, previous:states[i-1], active:current, inactive:states[i-1], focused:true, layouts:current.layouts, progress:1, transitionProgress:1, insets:{top:0,left:0,right:0,bottom:0}}));
const motion = keys.map(() => ({isScreenReady:makeMutable(true),state:{closing:makeMutable(0),animationProgress:makeMutable(1)}}));
const slotsMap = makeMutable({});
const orchestrators = frames.map(screenInterpolatorProps => ({screenInterpolatorProps, slotsMap, currentInterpolator: () => ({content:{opacity:1}}), pairPresentation: undefined as any}));
let currentIndex = 0;
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("../../providers/builder", () => ({
 useBuilderStore: (select: any) => select({derivations:{currentScreenKey:keys[currentIndex], destinationPairKey:currentIndex ? `${keys[currentIndex-1]}<>${keys[currentIndex]}` : undefined}}),
 useOptionalBuilderStore: (_keys: any, select: any) => keys.map((_,i) => select({derivations:{destinationPairKey:i ? `${keys[i-1]}<>${keys[i]}` : undefined}})),
}));
await mockModule("../../providers/builder/topology", () => ({useScreenRelationships: () => ({parentScreenKey:null})}));
await mockModule("../../providers/host/screen-host.provider", () => ({useOptionalScreenHostStore: (select:any) => select({scenes})}));
await mockModule("../../providers/motion", () => ({useMotionStore: (select:any) => select(motion[currentIndex]), useOptionalMotionStore: (_keys:any,select:any) => motion.map(select)}));
await mockModule("../../providers/orchestrator", () => ({
 useOrchestratorStore: (select:any) => select(orchestrators[0]),
 useOptionalOrchestratorStore: (keys:any,select:any) => keys ? orchestrators.map(select) : null,
}));
const {usePairPresentation} = await import("../../components/boundary/presentation/use-pair-presentation");
function PairOutputs() {
 for(let i=0;i<keys.length;i++) {currentIndex=i;orchestrators[i].pairPresentation=usePairPresentation(orchestrators[i] as any);}
 currentIndex=0;return null;
}
const {useBoundaryPresentation} = await import("../../components/boundary/presentation/use-boundary-presentation");

it("moves a container-only handoff through ready UI frames and back without a React render", async () => {
 const bounds={x:0,y:0,pageX:0,pageY:0,width:100,height:100};
 for(let i=1;i<keys.length;i++) {
  setSource(`${keys[i-1]}<>${keys[i]}`,"video",keys[i-1],bounds,{},undefined,{handoff:true});
  setDestination(`${keys[i-1]}<>${keys[i]}`,"video",keys[i],bounds,{},undefined,{handoff:true});
 }
 boundaryRegistry.set({video:{screens:Object.fromEntries(keys.map(key=>[key,{bounds,styles:{},handoff:true}]))}});
 motion[1].isScreenReady.set(false); motion[2].isScreenReady.set(false);
 let value: ReturnType<typeof useBoundaryPresentation>;
 let renders=0;
 function Probe() {renders++;value=useBoundaryPresentation("video");return null;}
 let root: ReturnType<typeof create>;
 await act(() => {root=create(<><PairOutputs/><Probe/></>);});
 expect(value!.presentation.get().receiver).toBe("a");
 motion[1].isScreenReady.set(true);
 expect(value!.presentation.get().receiver).toBe("b");
 motion[2].isScreenReady.set(true);
 expect(value!.presentation.get().receiver).toBe("c");
 motion[2].state.closing.set(1);motion[2].state.animationProgress.set(0);motion[2].isScreenReady.set(false);
 expect(value!.presentation.get().receiver).toBe("b");
 motion[1].state.closing.set(1);motion[1].state.animationProgress.set(0);motion[1].isScreenReady.set(false);
 expect(value!.presentation.get().receiver).toBe("a");
 expect(renders).toBe(1);
 await act(() => root!.unmount());
});

it("keeps closing boundary styles local and resets them at the UI endpoint", async () => {
 const bounds={x:0,y:0,pageX:0,pageY:0,width:100,height:100};
 motion[1].isScreenReady.set(true); motion[1].state.closing.set(1);motion[1].state.animationProgress.set(0.4);
 motion[2].isScreenReady.set(false);
 frames[1].set({...frames[1].get(), current:{...states[1], progress:0.4, closing:1}});
 orchestrators[1].currentInterpolator = (({active,focused}:any) => ({video:{transform:[{scale:focused ? 1 : active.progress}]}})) as any;
 setSource("a<>b","video","a",bounds,{},undefined,{handoff:true});
 setDestination("a<>b","video","b",bounds,{},undefined,{handoff:true});
 boundaryRegistry.set({video:{screens:{a:{bounds,styles:{},handoff:true},b:{bounds,styles:{},handoff:true}}}});
 let value: ReturnType<typeof useBoundaryPresentation>;
 function Probe() {value=useBoundaryPresentation("video");return null;}
 let root: ReturnType<typeof create>;
 await act(() => {root=create(<><PairOutputs/><Probe/></>);});
 expect(value!.slotsMap.get().video.style?.transform).toEqual([{scale:0.4}]);
 slotsMap.set({other:{style:{opacity:0.2}}} as any);
 expect(value!.slotsMap.get().video.style?.transform).toEqual([{scale:0.4}]);
 expect(slotsMap.get()).toEqual({other:{style:{opacity:0.2}}});
 motion[1].state.animationProgress.set(0);motion[1].isScreenReady.set(false);
 expect(value!.slotsMap.get().video.style?.transform).not.toEqual([{scale:0.4}]);
 expect(value!.presentation.get().receiver).toBe("a");
 await act(() => root!.unmount());
});
