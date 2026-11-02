// @ts-nocheck
/**
 * inactive: covers `inactiveBehavior` (keep | pause | hide | unmount) on the
 * blank stack. Screen A counts its own lifecycle in module-level counters that
 * survive remounts; A's behavior is switched with `navigation.setOptions`.
 * A becomes "inactive" (not just inert) once it is two screens down (A, B, C).
 *
 * Probes on A (`inactive-<name>`, "name:value"):
 *   behavior  current inactiveBehavior of A
 *   mounts    component instances created (rises only when A really remounts)
 *   effects   effect setups (React Activity tears effects down while paused/hidden
 *             and re-runs them on return; unmount also re-runs them)
 *   renders   total renders of A
 *   tick      1s interval counter held in A's state (resets on remount)
 *   away      interval ticks that fired while A was two or more screens down
 * Probe on C: `inactive-a-ticks` "aTicks:N", A's total interval ticks, live.
 *
 * Argent loop:
 *  1. Open lab (open-inactive). Expect inactive-a, behavior:hide, mounts:1.
 *  2. Tap inactive-behavior-keep. Expect behavior:keep, counters reset
 *     (mounts:1 effects:1 away:0).
 *  3. Tap inactive-push-b, expect inactive-b. Tap inactive-push-c, expect inactive-c.
 *  4. On C wait 1s, read inactive-a-ticks; wait 3s, read again.
 *     keep: the value rose by about 3. pause/hide/unmount: unchanged.
 *  5. Tap inactive-back, expect inactive-b. Tap inactive-back, expect inactive-a.
 *     Wait 1.5s, then read the probes:
 *       keep     mounts:1 effects:1 away:>=3
 *       pause    mounts:1 effects:2 away:<=1   (A stayed mounted, effects re-ran)
 *       hide     mounts:1 effects:2 away:<=1
 *       unmount  mounts:2 effects:2 away:<=1   (tick restarted from 0)
 *  6. Repeat steps 2-5 with inactive-behavior-pause, -hide, -unmount.
 *  7. Tap inactive-push-10 (10 pushes, 60ms apart). Within 2s expect inactive-d
 *     showing depth:10. Tap inactive-pop-top, expect inactive-a; probes still
 *     update (tick rises within 2s), no red box.
 */
import { useEffect, useRef, useState } from "react";
import { Button, createBlankStackNavigator, LabContainer, Page, Probe, slide, type Lab } from "./ui";

const Stack = createBlankStackNavigator();

const BEHAVIORS = ["keep", "pause", "hide", "unmount"] as const;
const INITIAL_BEHAVIOR = "hide";

/** Module-level so the numbers survive A unmounting. */
const stats = { behavior: INITIAL_BEHAVIOR, mounts: 0, effects: 0, renders: 0, ticks: 0, away: 0 };

function resetStats(behavior: string, mounted: number) {
	Object.assign(stats, { behavior, mounts: mounted, effects: mounted, renders: 0, away: 0 });
}

function A({ navigation }) {
	const counted = useRef(false);
	const [tick, setTick] = useState(0);
	stats.renders += 1;

	useEffect(() => {
		// Refs survive React Activity pause/hide, so only a real remount counts.
		if (!counted.current) {
			counted.current = true;
			stats.mounts += 1;
		}
		stats.effects += 1;
		const interval = setInterval(() => {
			stats.ticks += 1;
			if ((navigation.getState()?.routes?.length ?? 1) >= 3) stats.away += 1;
			setTick((value) => value + 1);
		}, 1000);
		return () => clearInterval(interval);
	}, [navigation]);

	const choose = (behavior: string) => {
		navigation.setOptions({ inactiveBehavior: behavior });
		resetStats(behavior, 1);
		setTick(0);
	};

	const pushTen = () => {
		for (let depth = 1; depth <= 10; depth++) {
			setTimeout(() => navigation.push("D", { depth }), depth * 60);
		}
	};

	return (
		<Page title="A" testID="inactive-a" scroll>
			<Probe testID="inactive-behavior" value={`behavior:${stats.behavior}`} />
			<Probe testID="inactive-mounts" value={`mounts:${stats.mounts}`} />
			<Probe testID="inactive-effects" value={`effects:${stats.effects}`} />
			<Probe testID="inactive-renders" value={`renders:${stats.renders}`} />
			<Probe testID="inactive-tick" value={`tick:${tick}`} />
			<Probe testID="inactive-away" value={`away:${stats.away}`} />
			{BEHAVIORS.map((behavior) => (
				<Button key={behavior} label={`behavior: ${behavior}`} testID={`inactive-behavior-${behavior}`} onPress={() => choose(behavior)} />
			))}
			<Button label="push B" testID="inactive-push-b" onPress={() => navigation.push("B")} />
			<Button label="push 10 rapidly" testID="inactive-push-10" onPress={pushTen} />
		</Page>
	);
}

function B({ navigation }) {
	return (
		<Page title="B" testID="inactive-b">
			<Probe testID="inactive-b-note" value="a:inert" />
			<Button label="push C" testID="inactive-push-c" onPress={() => navigation.push("C")} />
			<Button label="back" testID="inactive-back" onPress={() => navigation.goBack()} />
		</Page>
	);
}

function C({ navigation }) {
	const [, refresh] = useState(0);
	useEffect(() => {
		const interval = setInterval(() => refresh((value) => value + 1), 500);
		return () => clearInterval(interval);
	}, []);
	return (
		<Page title="C" testID="inactive-c">
			<Probe testID="inactive-a-ticks" value={`aTicks:${stats.ticks}`} />
			<Probe testID="inactive-c-behavior" value={`aBehavior:${stats.behavior}`} />
			<Button label="back" testID="inactive-back" onPress={() => navigation.goBack()} />
			<Button label="pop to top" testID="inactive-pop-top" onPress={() => navigation.popToTop()} />
		</Page>
	);
}

function D({ navigation, route }) {
	const depth = route.params?.depth ?? 0;
	return (
		<Page title={`D${depth}`} testID="inactive-d">
			<Probe testID="inactive-depth" value={`depth:${depth}`} />
			<Button label="back" testID="inactive-back" onPress={() => navigation.goBack()} />
			<Button label="pop to top" testID="inactive-pop-top" onPress={() => navigation.popToTop()} />
		</Page>
	);
}

function Component() {
	// Fresh counters every time the lab opens (the navigator, and A's options, are new too).
	const opened = useRef(false);
	if (!opened.current) {
		opened.current = true;
		resetStats(INITIAL_BEHAVIOR, 0);
	}
	return (
		<LabContainer>
			<Stack.Navigator>
				<Stack.Screen name="A" component={A} options={slide("horizontal", { inactiveBehavior: INITIAL_BEHAVIOR })} />
				<Stack.Screen name="B" component={B} options={slide()} />
				<Stack.Screen name="C" component={C} options={slide()} />
				<Stack.Screen name="D" component={D} options={slide()} />
			</Stack.Navigator>
		</LabContainer>
	);
}

export const lab: Lab = {
	id: "inactive",
	title: "inactive",
	covers: "inactiveBehavior keep/pause/hide/unmount (setOptions), lifecycle counters two screens down, 10 rapid pushes",
	Component,
};
