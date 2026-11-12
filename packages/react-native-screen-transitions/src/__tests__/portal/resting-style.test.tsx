import { expect, it } from 'bun:test';
import { act, create } from 'react-test-renderer';
import { makeMutable } from 'react-native-reanimated';
import { useComposedBoundaryStyle } from '../../components/boundary/presentation/use-composed-boundary-style';
import type { NormalizedTransitionInterpolatedStyle } from '../../types/animation.types';
import { restingStyleValue } from '../../utils/bounds/helpers/styles/visual-styles';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

it('rests a reset key at the boundary own value, not the neutral one (no square frame on landing)', async () => {
 const card = {borderRadius: 28, borderWidth: 3, opacity: 0.85};
 const slots = makeMutable<NormalizedTransitionInterpolatedStyle>({
  box: {style: {borderRadius: 12, borderWidth: 1, opacity: 0.5, transform: [{scale: 2}]}},
 });
 let output: any;
 function Probe() {
  output = useComposedBoundaryStyle(slots, 'box', card, 'full');
  return null;
 }
 let root: ReturnType<typeof create>;
 await act(() => {root = create(<Probe/>);});
 expect(output.borderRadius).toBe(12);
 // The frame its pair ends: the orchestrator resets what the slot stopped setting to neutral values.
 slots.set({box: {
  style: {borderRadius: 0, borderWidth: 0, opacity: 1, transform: [{scale: 1}]},
  resetStyleKeys: {borderRadius: true, borderWidth: true, opacity: true, transform: true},
 }});
 await act(() => root!.update(<Probe/>));
 expect(output.borderRadius).toBe(28);
 expect(output.borderWidth).toBe(3);
 expect(output.opacity).toBe(0.85);
 // A value the slot sets on purpose (not a reset) still wins.
 slots.set({box: {style: {borderRadius: 0}}});
 await act(() => root!.update(<Probe/>));
 expect(output.borderRadius).toBe(0);
 await act(() => root!.unmount());
});

it('resets a corner the boundary leaves to its borderRadius when the slot stops setting it', async () => {
 const slots = makeMutable<NormalizedTransitionInterpolatedStyle>({box: {style: {borderTopLeftRadius: 4}}});
 let output: any;
 function Probe() {
  output = useComposedBoundaryStyle(slots, 'box', {borderRadius: 28}, 'full');
  return null;
 }
 let root: ReturnType<typeof create>;
 await act(() => {root = create(<Probe/>);});
 expect(output.borderTopLeftRadius).toBe(4);
 slots.set({});
 await act(() => root!.update(<Probe/>));
 expect(output.borderTopLeftRadius).toBe(28);
 await act(() => root!.unmount());
});

it('resolves resting values: own key, then its shorthand, then neutral', () => {
 const base = {borderRadius: 28, borderTopLeftRadius: 0, borderWidth: 2, opacity: 0.85};
 expect(restingStyleValue('borderTopLeftRadius', base)).toBe(0);
 expect(restingStyleValue('borderTopRightRadius', base)).toBe(28);
 expect(restingStyleValue('borderBottomStartRadius', base)).toBe(28);
 expect(restingStyleValue('borderLeftWidth', base)).toBe(2);
 expect(restingStyleValue('opacity', base)).toBe(0.85);
 expect(restingStyleValue('borderRadius', {})).toBe(0);
 expect(restingStyleValue('borderWidth', {})).toBe(0);
 expect(restingStyleValue('borderTopWidth', {})).toBe(0);
 expect(restingStyleValue('shadowOpacity', {})).toBe(0);
 expect(restingStyleValue('width', {})).toBeUndefined();
});
