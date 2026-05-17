import type { ScreenOptionsSnapshot } from "../../options";
import type {
	GesturePolicy,
	GestureRuntime,
	PanGesturePolicy,
	PanGestureRuntime,
	PinchGesturePolicy,
	PinchGestureRuntime,
} from "../types";
import type { GesturePolicyOptions } from "./policy";
import {
	resolvePanPolicy,
	resolvePinchPolicy,
	resolveRuntimeGestureParticipation,
} from "./policy";

const resolveRuntimeOptions = (
	policy: GesturePolicy,
	screenOptions: ScreenOptionsSnapshot,
): GesturePolicyOptions => {
	"worklet";

	return {
		...screenOptions,
		transitionSpec: policy.transitionSpec,
	};
};

type RuntimePolicyResolver<TPolicy extends GesturePolicy> = (
	options: GesturePolicyOptions,
	hasSnapPoints: boolean,
) => TPolicy;

const resolveRuntime = <TPolicy extends GesturePolicy>(
	runtime: GestureRuntime<TPolicy>,
	screenOptions: ScreenOptionsSnapshot,
	resolvePolicy: RuntimePolicyResolver<TPolicy>,
): GestureRuntime<TPolicy> => {
	"worklet";
	const participation = resolveRuntimeGestureParticipation({
		participation: runtime.participation,
		options: screenOptions,
	});
	const options = resolveRuntimeOptions(runtime.policy, screenOptions);
	const hasSnapPoints = participation.effectiveSnapPoints.hasSnapPoints;

	return {
		...runtime,
		participation,
		policy: resolvePolicy(options, hasSnapPoints),
	};
};

export const resolvePanRuntime = (
	runtime: PanGestureRuntime,
	screenOptions: ScreenOptionsSnapshot,
): PanGestureRuntime => {
	"worklet";
	return resolveRuntime<PanGesturePolicy>(
		runtime,
		screenOptions,
		resolvePanPolicy,
	);
};

export const resolvePinchRuntime = (
	runtime: PinchGestureRuntime,
	screenOptions: ScreenOptionsSnapshot,
): PinchGestureRuntime => {
	"worklet";
	return resolveRuntime<PinchGesturePolicy>(
		runtime,
		screenOptions,
		resolvePinchPolicy,
	);
};
