import { createModuleMock } from "../helpers/mock-module";
import { expect, it } from "bun:test";
import { act, create } from 'react-test-renderer';
import { makeMutable } from 'react-native-reanimated';
import type { MeasureBoundary, BoundaryLocalMeasurement } from '../../components/boundary/types';

const motion = {isScreenReady:makeMutable(false), state:{pendingLifecycleStartBlockCount:makeMutable(1)}};
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule('../../providers/motion', () => ({useMotionStore:(select:any)=>select(motion)}));
const {useMeasurer} = await import('../../components/boundary/hooks/use-measurer');
const {useFirstEscapeMeasureKey} = await import('../../components/boundary/utils/first-escape-measure');
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let firstMeasures = 0;
const onFirstMeasure = () => {firstMeasures++;};
it('captures destination escape placement in corrected coordinates and rejects invalid captures', async () => {
 const localMeasurement = makeMutable<BoundaryLocalMeasurement | null>(null);
 const ref = {current:{measurement:{x:0,y:0,pageX:0,pageY:1915,width:310,height:100}}};
 let measureBoundary: MeasureBoundary;
 function Probe() {
  const firstEscapeMeasureKey = useFirstEscapeMeasureKey(onFirstMeasure);
  measureBoundary = useMeasurer({enabled:true,boundTag:{tag:'box',linkKey:'box'},currentScreenKey:'B',preparedStyles:{},measuredAnimatedRef:ref as never,handoff:true,escapeClipping:true,localMeasurement,firstEscapeMeasureKey});
  return null;
 }
 let root: ReturnType<typeof create>;
 await act(() => {root=create(<Probe/>);});
 measureBoundary!({type:'destination',pairKey:'A<>B'});
 expect(localMeasurement.get()?.bounds.pageY).toBe(226);
 expect(localMeasurement.get()?.pairKey).toBe('A<>B');
 // The first accepted capture activates the overlay host, once.
 measureBoundary!({type:'destination',pairKey:'A<>B'});
 expect(firstMeasures).toBe(1);
 const accepted = localMeasurement.get();
 ref.current.measurement.pageY = 9000;
 measureBoundary!({type:'destination',pairKey:'B<>C'});
 expect(localMeasurement.get()).toBe(accepted);
 await act(() => root!.unmount());
});
