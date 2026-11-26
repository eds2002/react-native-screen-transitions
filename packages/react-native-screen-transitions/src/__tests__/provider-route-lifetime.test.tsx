import { afterEach, expect, it } from "bun:test";
import { Activity, type ReactNode, StrictMode } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import createProvider from "../utils/create-provider";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const retired: string[] = [];
const { StoreProvider: Routes } = createProvider("RouteOwner")<{}, Record<string, string>>(
 () => { throw new Error("adapted only"); },
 { getRouteKeys: Object.keys, onRouteRemoved: (key) => { retired.push(key); } },
);
const { StoreProvider: Screen, useOptionalScreenStateStore } = createProvider("ScreenState", {global: true})<{}, {progress: number}>(
 () => { throw new Error("adapted only"); },
);
let renderer: ReactTestRenderer | undefined;
let selected: readonly ({progress: number} | null)[] = [];
function Reader() { selected = useOptionalScreenStateStore(["A", "B"]); return null; }
const update = (children: ReactNode) => act(() => {
 const tree = <>{children}<Reader /></>;
 if (renderer) renderer.update(tree); else renderer = create(tree);
});
afterEach(() => {act(() => renderer?.unmount()); renderer = undefined; retired.length = 0;});

it("keeps hidden stores, resumes with fresh values, and releases removed hidden routes", () => {
 const tree = (mode: "visible" | "hidden", routes = {A: "active", B: "inactive"} as Record<string,string>, progress = 1) => (
  <Routes value={routes}>
   <Activity mode={mode}><Screen storeKey="A" value={{progress}} /><Screen storeKey="B" value={{progress: 1}} /></Activity>
  </Routes>
 );
 update(tree("visible"));
 const original = selected[0];
 update(tree("hidden"));
 expect(selected[0]).toBe(original);
 expect(selected[1]?.progress).toBe(1);
 update(tree("hidden", {A:"active"}));
 expect(selected[0]).toBe(original);
 expect(selected[1]).toBeNull();
 update(tree("visible", {A:"active"}, 0.5));
 expect(selected[0]?.progress).toBe(0.5);
 update(null);
 expect(selected).toEqual([null, null]);
});

it("retains an unmounted view until its route is absent", () => {
 const tree = (show: boolean, activity?: string) => <Routes value={activity ? {A:activity} : {}}>{show && <Screen storeKey="A" value={{progress:1}} />}</Routes>;
 update(tree(true,"active"));
 update(tree(false,"inactive"));
 expect(selected[0]?.progress).toBe(1);
 update(tree(false,"closing"));
 expect(selected[0]?.progress).toBe(1);
 update(tree(true,"active"));
 update(tree(false,"inactive"));
 update(tree(false));
 expect(selected[0]).toBeNull();
 expect(retired).toEqual(["A"]);
});

it("an old retained registration cannot remove its replacement", () => {
 const tree = (version: number, show = true) => <Routes value={{A:"inactive"}}>{show && <Screen key={version} storeKey="A" value={{progress:version}} />}</Routes>;
 update(tree(1));
 update(tree(1,false));
 update(tree(2));
 expect(selected[0]?.progress).toBe(2);
 update(null);
 expect(selected[0]).toBeNull();
});

it("retains nested owners through ancestor Activity and disposes their descendants on removal", () => {
 const tree = (mode: "visible" | "hidden", exists = true) => <Routes value={exists ? {A:"active"} : {}}>
  <Activity mode={mode}>
   <Screen storeKey="A" value={{progress:1}}>
    <Routes value={{B:"active"}}><Screen storeKey="B" value={{progress:2}} /></Routes>
   </Screen>
  </Activity>
 </Routes>;
 update(tree("visible"));
 update(tree("hidden"));
 expect(selected.map(v => v?.progress)).toEqual([1,2]);
 expect(retired).toEqual([]);
 update(tree("visible"));
 expect(selected.map(v => v?.progress)).toEqual([1,2]);
 update(tree("hidden"));
 update(tree("hidden",false));
 expect(selected).toEqual([null,null]);
 expect(retired).toEqual(["A", "B"]);
});

it("releases route resources only after committed removal", () => {
 const tree = (mode: "visible" | "hidden", activity: string) => (
  <StrictMode><Activity mode={mode}>
   <Routes value={activity ? {A:activity} : {}}><Screen storeKey="A" value={{progress:1}} /></Routes>
  </Activity></StrictMode>
 );
 update(tree("visible", "active"));
 update(tree("hidden", "active"));
 update(tree("visible", "preloaded"));
 update(tree("visible", "closing"));
 expect(retired).toEqual([]);
 update(tree("visible", ""));
 expect(retired).toEqual(["A"]);
});

it("does not dispose mounted stores merely because a close starts and cancels", () => {
 const tree = (activity: string) => <Routes value={{A:activity}}><Screen storeKey="A" value={{progress:0.5}} /></Routes>;
 update(tree("active"));
 update(tree("closing"));
 expect(selected[0]?.progress).toBe(0.5);
 update(tree("active"));
 expect(selected[0]?.progress).toBe(0.5);
});

it("releases an explicitly disabled registration even while its route exists", () => {
 const tree = (register: boolean) => <Routes value={{A:"active"}}><Screen storeKey="A" registerGlobally={register} value={{progress:1}} /></Routes>;
 update(tree(true));
 expect(selected[0]?.progress).toBe(1);
 update(tree(false));
 expect(selected[0]).toBeNull();
});
