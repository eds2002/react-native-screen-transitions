import { expect, it } from 'bun:test';
import { act, create } from 'react-test-renderer';
import { makeMutable } from 'react-native-reanimated';
import { createLocalMeasurementRef, writeLocalMeasurement } from '../../components/boundary/measure/local-measurements';
import { useComposedBoundaryStyle } from '../../components/boundary/presentation/use-composed-boundary-style';
import type { NormalizedTransitionInterpolatedStyle } from '../../types/animation.types';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

it('keeps escaped roots measurable, applies live dimensions, and restores base size', async () => {
 const slots = makeMutable<NormalizedTransitionInterpolatedStyle>({});
 let output: any;
 function Probe() {
  output = useComposedBoundaryStyle(slots, 'box', [{width:100}, {height:100}], 'layout');
  return null;
 }
 let root: ReturnType<typeof create>;
 await act(() => {root = create(<Probe/>);});
 expect(output.width).toBe(100);
 expect(output.height).toBe(100);
 for (const width of [120,200,310]) {
  slots.set({box:{style:{width,height:160,transform:[{translateX:50}]}}});
  await act(() => root!.update(<Probe/>));
  expect(output.width).toBe(width);
  expect(output.height).toBe(160);
  expect(output.transform).toBeUndefined();
 }
 slots.set({});
 await act(() => root!.update(<Probe/>));
 expect(output.width).toBe(100);
 expect(output.height).toBe(100);
 await act(() => root!.unmount());
});

it('resets what the full style set when the root escapes (a boundary hidden by its slot does not stay hidden)', async () => {
 const slots = makeMutable<NormalizedTransitionInterpolatedStyle>({box:{style:{opacity:0,transform:[{scale:2}]}}});
 const presentation = makeMutable<any>({owner:undefined, slots:{}});
 const localMeasurement = createLocalMeasurementRef(101);
 const portalHostReady = makeMutable(false);
 const escapeState = {boundaryId:'box', presentation, localMeasurement, portalHostReady};
 let output: any;
 function Probe() {
  output = useComposedBoundaryStyle(slots, 'box', {width:100, height:80}, 'full', escapeState);
  return null;
 }
 let root: ReturnType<typeof create>;
 await act(() => {root = create(<Probe/>);});
 // Inline and hidden by its slot (the active source of an open zoom).
 expect(output.opacity).toBe(0);
 // Now it escapes: the host applies the slot, the root keeps only layout and must not stay at opacity 0.
 writeLocalMeasurement(localMeasurement, {pairKey:'A<>B', bounds:{}} as any);
 portalHostReady.set(true);
 presentation.set({owner:{ready:true, pairKey:'A<>B'}, slots:{box:{style:{opacity:0}}}});
 await act(() => root!.update(<Probe/>));
 expect(output.width).toBe(100);
 expect(output.opacity).toBe(1);
 expect(output.transform).toBeDefined();
 // The reset is sent once; later frames carry layout only.
 await act(() => root!.update(<Probe/>));
 expect(output.opacity).toBeUndefined();
 await act(() => root!.unmount());
});
