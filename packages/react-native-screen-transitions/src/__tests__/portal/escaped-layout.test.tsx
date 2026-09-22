import { expect, it } from 'bun:test';
import { act, create } from 'react-test-renderer';
import { makeMutable } from 'react-native-reanimated';
import { useComposedBoundaryStyle } from '../../components/boundary/hooks/use-composed-boundary-style';
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
