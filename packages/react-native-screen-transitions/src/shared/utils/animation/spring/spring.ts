import type {
	Animation,
	AnimationCallback,
	ReduceMotion,
} from "react-native-reanimated";
import type { AnimationStateCallback } from "../state";
import type { SpringConfig } from "./springConfigs";
import type {
	DefaultSpringConfig,
	InnerSpringAnimation,
	SpringAnimation,
	SpringConfigInner,
} from "./springUtils";
import {
	calculateNewStiffnessToMatchDuration,
	checkIfConfigIsValid,
	criticallyDampedSpringCalculations,
	getEnergy,
	initialCalculations,
	isAnimationSettledCalculation,
	isAnimationTerminatingCalculation,
	safeMergeConfigs,
	scaleZetaToMatchClamps,
	underDampedSpringCalculations,
} from "./springUtils";

type Timestamp = number;

const REACT_NATIVE_RUNTIME_KIND = 1;
const REDUCE_MOTION_SYSTEM = "system";
const REDUCE_MOTION_ALWAYS = "always";
const DEFAULT_SPRING_SETTLE_DISTANCE = 0.001;

const DEFAULT_SPRING_CONFIG = {
	damping: 120,
	mass: 4,
	stiffness: 900,
	duration: 550,
	dampingRatio: 1,
	overshootClamping: false,
	energyThreshold: 6e-9,
	velocity: 0,
	reduceMotion: undefined,
	clamp: undefined,
} as const satisfies DefaultSpringConfig;

const getRuntimeKind = () => {
	"worklet";
	return (globalThis as { __RUNTIME_KIND?: number }).__RUNTIME_KIND;
};

const getReduceMotionForAnimation = (config?: ReduceMotion) => {
	"worklet";
	if (!config || config === REDUCE_MOTION_SYSTEM) {
		return undefined;
	}

	return config === REDUCE_MOTION_ALWAYS;
};

const defineSpringAnimation = <TAnimation extends Animation<TAnimation>>(
	_starting: number,
	factory: () => TAnimation,
): TAnimation => {
	"worklet";
	const create = (() => {
		"worklet";
		const animation = factory();
		const baseOnStart = animation.onStart;

		animation.onStart = (
			animation: TAnimation,
			value: Parameters<TAnimation["onStart"]>[1],
			timestamp: Timestamp,
			previousAnimation: Parameters<TAnimation["onStart"]>[3],
		) => {
			"worklet";
			if (animation.reduceMotion) {
				animation.current = animation.toValue;
				animation.onFrame = () => true;
				return;
			}

			baseOnStart(animation, value, timestamp, previousAnimation);
		};

		return animation;
	}) as (() => TAnimation) & { __isAnimationDefinition?: true };

	if (getRuntimeKind() !== REACT_NATIVE_RUNTIME_KIND) {
		return create();
	}

	create.__isAnimationDefinition = true;
	return create as unknown as TAnimation;
};

type withSpringType = (
	toValue: number,
	userConfig?: SpringConfig,
	callback?: AnimationStateCallback,
) => number;

/**
 * Internal numeric spring forked from Reanimated's `withSpring`.
 *
 * As of version 4.4, Reanimated resets the spring velocity to zero whenever it
 * initially points away from the target (see
 * https://github.com/software-mansion/react-native-reanimated/pull/9463).
 * That's a reasonable fix for stale inherited velocity in Reanimated's public
 * spring behavior, but our gesture release handoff relies on that
 * away-from-target velocity on purpose. It's what preserves the visual
 * dismissal tail controlled by `gestureReleaseVelocityScale`.
 *
 * We went with this fork rather than trying to recreate the velocity scale
 * outside the spring, since that approach pushed too much state and timing
 * logic into the transition layer, bloated the code, and made the handoff
 * easier to get subtly wrong. Keeping the fork lets screen transitions hold on
 * to the native spring handoff behavior while keeping our own surface small and
 * easy to extend with callbacks tailored to the transition lifecycle.
 */
export const withInternalSpring = ((
	toValue: number,
	userConfig?: SpringConfig,
	callback?: AnimationStateCallback,
): Animation<SpringAnimation> => {
	"worklet";

	return defineSpringAnimation<SpringAnimation>(toValue, () => {
		"worklet";
		const config: DefaultSpringConfig & SpringConfigInner = safeMergeConfigs<
			DefaultSpringConfig & SpringConfigInner
		>(
			{
				...DEFAULT_SPRING_CONFIG,
				useDuration: !!(userConfig?.duration || userConfig?.dampingRatio),
				skipAnimation: false,
				settleDistance: DEFAULT_SPRING_SETTLE_DISTANCE,
			},
			userConfig,
		);

		let settled = false;

		const notifySettled = (animation: SpringAnimation) => {
			"worklet";
			if (settled) {
				return;
			}

			if (!isAnimationSettledCalculation(animation, config)) {
				return;
			}

			settled = true;
			animation.settled = true;
			callback?.({
				finished: false,
				settled: true,
			});
		};

		config.skipAnimation = !checkIfConfigIsValid(config);

		if (config.duration === 0) {
			config.skipAnimation = true;
		}

		function springOnFrame(
			animation: InnerSpringAnimation,
			now: Timestamp,
		): boolean {
			// eslint-disable-next-line @typescript-eslint/no-shadow
			const { toValue, current } = animation;

			if (config.skipAnimation) {
				animation.current = toValue;
				animation.lastTimestamp = 0;
				return true;
			}
			const { lastTimestamp, velocity } = animation;

			const deltaTime = Math.min(Math.max(now - lastTimestamp, 0), 64);
			animation.lastTimestamp = now;

			const t = deltaTime / 1000;
			const v0 = velocity as number;
			const x0 = current - toValue;

			const { zeta, omega0, omega1 } = animation;

			const { position: newPosition, velocity: newVelocity } =
				zeta < 1
					? underDampedSpringCalculations(animation, {
							zeta,
							v0,
							x0,
							omega0,
							omega1,
							t,
						})
					: criticallyDampedSpringCalculations(animation, {
							v0,
							x0,
							omega0,
							t,
						});

			animation.current = newPosition;
			animation.velocity = newVelocity;

			if (isAnimationTerminatingCalculation(animation, config)) {
				animation.velocity = 0;
				animation.current = toValue;
				settled = true;
				animation.settled = true;
				// clear lastTimestamp to avoid using stale value by the next spring animation that starts after this one
				animation.lastTimestamp = 0;
				return true;
			}

			notifySettled(animation);

			return false;
		}

		function isTriggeredTwice(
			previousAnimation: SpringAnimation | undefined,
			animation: SpringAnimation,
		) {
			return (
				previousAnimation?.lastTimestamp &&
				previousAnimation?.startTimestamp &&
				previousAnimation?.toValue === animation.toValue &&
				previousAnimation?.duration === animation.duration &&
				previousAnimation?.dampingRatio === animation.dampingRatio
			);
		}

		function onStart(
			animation: SpringAnimation,
			value: number,
			now: Timestamp,
			previousAnimation: SpringAnimation | undefined,
		): void {
			animation.current = value;

			let stiffness = config.stiffness;
			const triggeredTwice = isTriggeredTwice(previousAnimation, animation);

			const duration = config.duration;

			const x0 = triggeredTwice
				? // If animation is triggered twice we want to continue the previous animation
					// form the previous starting point
					(previousAnimation?.startValue as number)
				: value - (animation.toValue as number);

			animation.startValue = x0;

			if (previousAnimation) {
				animation.velocity =
					(triggeredTwice
						? previousAnimation?.velocity
						: previousAnimation?.velocity + config.velocity) || 0;
			} else {
				animation.velocity = config.velocity || 0;
			}

			if (triggeredTwice) {
				animation.zeta = previousAnimation?.zeta || 0;
				animation.omega0 = previousAnimation?.omega0 || 0;
				animation.omega1 = previousAnimation?.omega1 || 0;
			} else {
				if (config.useDuration) {
					const actualDuration = triggeredTwice
						? // If animation is triggered twice we want to continue the previous animation
							// so we need to include the time that already elapsed
							duration -
							((previousAnimation?.lastTimestamp || 0) -
								(previousAnimation?.startTimestamp || 0))
						: duration;

					config.duration = actualDuration;
					stiffness = calculateNewStiffnessToMatchDuration(
						x0,
						config,
						animation.velocity,
					);
					config.stiffness = stiffness;
				}

				const { zeta, omega0, omega1 } = initialCalculations(stiffness, config);
				animation.zeta = zeta;
				animation.omega0 = omega0;
				animation.omega1 = omega1;

				if (config.clamp !== undefined) {
					animation.zeta = scaleZetaToMatchClamps(animation, config.clamp);
				}
			}

			const initialEnergy = getEnergy(
				x0,
				config.velocity,
				config.stiffness,
				config.mass,
			);
			animation.initialEnergy = initialEnergy;

			animation.lastTimestamp = previousAnimation?.lastTimestamp || now;

			animation.startTimestamp = triggeredTwice
				? previousAnimation?.startTimestamp || now
				: now;

			notifySettled(animation);
		}

		const animation = {
			onFrame: springOnFrame,
			onStart,
			toValue,
			velocity: config.velocity || 0,
			current: toValue,
			settled: false,
			startValue: 0,
			callback: ((finished?: boolean) => {
				"worklet";
				const didFinish = finished === true;
				callback?.({
					finished: didFinish,
					settled: didFinish || settled,
				});
			}) as AnimationCallback,
			lastTimestamp: 0,
			startTimestamp: 0,
			zeta: 0,
			omega0: 0,
			omega1: 0,
			initialEnergy: 0,
			reduceMotion: getReduceMotionForAnimation(config.reduceMotion),
		} as SpringAnimation;

		return animation;
	});
}) as unknown as withSpringType;
