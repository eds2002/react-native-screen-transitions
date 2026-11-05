// @ts-nocheck
/**
 * motion: standalone motion units (useMotion, Transition.Motion, Transition.Presence), no navigator.
 *   pager    useMotion({ initial: "open" }) whose snap points are pages; a horizontal swipe turns
 *            one page (sheetSnapBehavior "step"), no dismissal (gestureEnabled false)
 *   sheet    useMotion({ snapPoints: [0.4, 0.85] }) opened and closed from buttons; drag down
 *            or tap the backdrop to dismiss
 *   presence Transition.Presence with an "auto" snap point: mounts on open, unmounts after close
 *
 * Spam bar (e2e, y ≈ 0.135): sheet +, sheet −, presence +, presence − (bridge notes "sheet" and
 * "presence" hold what the last press asked for). Units report to the bridge as pager, sheet, presence.
 *
 * Probes: motion-pager ("page:N status:S"), motion-sheet ("status:S progress:P"),
 * motion-presence ("mounted:B status:S").
 *
 * Argent loop (open harness://lab/motion):
 *  1. read motion-pager → "page:0 status:open"; motion-sheet → "status:closed progress:0"
 *  2. swipe left on the pager (0.8,0.25 → 0.2,0.25) → "page:1"; again → "page:2"
 *  3. swipe right on the pager → "page:1"; swipe right hard twice → "page:0", never "status:closing"
 *  4. tap motion-sheet-open → sheet rises to 40%, "status:open progress:0.4"
 *  5. tap motion-sheet-snap-1 → "progress:0.85"; swipe down from 0.5,0.3 to 0.5,0.95 → "status:closed"
 *  6. tap motion-sheet-open, tap the backdrop (0.5,0.2) → "status:closed"
 *  7. tap motion-presence-open → presence sheet rises to its content height, "mounted:true status:open"
 *  8. swipe it down → "mounted:false" once closed; tap motion-presence-open again → reopens
 */
import { useEffect, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { interpolate, useAnimatedReaction } from "react-native-reanimated";
import Transition, { useMotion, useScreenAnimation } from "react-native-screen-transitions";
import { scheduleOnRN } from "react-native-worklets";
import { bridge, Button, colorFor, Probe, ScreenReporter, SpamBar, SPEC, type Lab } from "./ui";

const PAGES = ["one", "two", "three", "four"];
const PAGE_STOPS = PAGES.map((_, i) => (i + 1) / PAGES.length);

/** Reports a motion handle's status and progress to a probe (rounded, so it doesn't re-render every frame). */
function useMotionProbe(motion, format) {
	const [text, setText] = useState("");
	useAnimatedReaction(
		() => format(motion.status.get(), motion.progress.get()),
		(next, previous) => {
			if (next !== previous) scheduleOnRN(setText, next);
		},
	);
	return text;
}

const pagerOptions = {
	initial: "open",
	snapPoints: PAGE_STOPS,
	initialSnapIndex: 0,
	gestureEnabled: false,
	gestureDirection: "horizontal",
	// One page per swipe, however fast.
	sheetSnapBehavior: "step",
	transitionSpec: { open: SPEC, close: SPEC },
	screenStyleInterpolator: ({ progress, layouts: { screen } }) => {
		"worklet";
		const page = progress * PAGE_STOPS.length - 1;
		return { content: { style: { transform: [{ translateX: -page * screen.width }] } } };
	},
};

function Pager() {
	const { width } = useWindowDimensions();
	const motion = useMotion(pagerOptions);
	const text = useMotionProbe(motion, (status, progress) => {
		"worklet";
		return `page:${Math.round(progress * PAGE_STOPS.length - 1)} status:${status}`;
	});
	return (
		<View>
			<View testID="motion-pager-box" style={{ height: 180, overflow: "hidden" }}>
				<Transition.Motion value={motion}>
					<ScreenReporter routeKey="pager" name="pager" />
					<View style={{ flexDirection: "row", width: width * PAGES.length, height: 180 }}>
						{PAGES.map((page) => (
							<View key={page} testID={`motion-page-${page}`} style={{ width, height: 180, backgroundColor: colorFor(page), justifyContent: "center", alignItems: "center" }}>
								<Text style={{ color: "white", fontSize: 40, fontWeight: "800" }}>{page}</Text>
							</View>
						))}
					</View>
				</Transition.Motion>
			</View>
			<Probe testID="motion-pager" value={text} />
		</View>
	);
}

const sheetInterpolator = ({ progress, layouts: { screen } }) => {
	"worklet";
	return {
		content: { style: { transform: [{ translateY: interpolate(progress, [0, 1], [screen.height, 0], "clamp") }] } },
		backdrop: { style: { backgroundColor: "black", opacity: interpolate(progress, [0, 0.4], [0, 0.5], "clamp") } },
	};
};

const sheetOptions = {
	snapPoints: [0.4, 0.85],
	gestureEnabled: true,
	gestureDirection: "vertical",
	backdropBehavior: "dismiss",
	transitionSpec: { open: SPEC, close: SPEC },
	screenStyleInterpolator: sheetInterpolator,
};

function SheetBody({ testID, title, children, full = true }) {
	const { height } = useWindowDimensions();
	return (
		<View testID={testID} style={{ backgroundColor: "#111827", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, gap: 10, minHeight: full ? height : undefined }}>
			<View style={{ alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "#fff6" }} />
			<Text style={{ color: "white", fontSize: 24, fontWeight: "800" }}>{title}</Text>
			{children}
		</View>
	);
}

/** Inside a unit, useScreenAnimation() reads that unit, as it does in a screen. */
function InsideProbe({ testID }) {
	const animation = useScreenAnimation();
	const [text, setText] = useState("");
	useAnimatedReaction(
		() => `inside:${Math.round(animation.get().current.progress * 100) / 100}`,
		(next, previous) => {
			if (next !== previous) scheduleOnRN(setText, next);
		},
	);
	return <Probe testID={testID} value={text} />;
}

function Component() {
	const sheet = useMotion(sheetOptions);
	const sheetText = useMotionProbe(sheet, (status, progress) => {
		"worklet";
		return `status:${status} progress:${Math.round(progress * 100) / 100}`;
	});
	const [presenceOpen, setPresenceOpen] = useState(false);
	const [presenceMounted, setPresenceMounted] = useState(false);
	const [presenceStatus, setPresenceStatus] = useState("closed");

	return (
		<View testID="motion-home" style={{ flex: 1, backgroundColor: "#0b0b0f", paddingTop: 110, gap: 12 }}>
			<Pager />
			<View style={{ paddingHorizontal: 20, gap: 10 }}>
				<Probe testID="motion-sheet" value={sheetText} />
				<Probe testID="motion-presence" value={`mounted:${presenceMounted} status:${presenceStatus}`} />
				<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
					<Button label="open sheet" testID="motion-sheet-open" onPress={sheet.open} />
					<Button label="open presence" testID="motion-presence-open" onPress={() => setPresenceOpen(true)} />
				</View>
			</View>

			<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
				<Transition.Motion value={sheet}>
					<SheetBody testID="motion-sheet-body" title="Sheet">
						<ScreenReporter routeKey="sheet" name="sheet" />
						<InsideProbe testID="motion-sheet-inside" />
						<View style={{ flexDirection: "row", gap: 8 }}>
							<Button label="snap 0" testID="motion-sheet-snap-0" onPress={() => sheet.snapTo(0)} />
							<Button label="snap 1" testID="motion-sheet-snap-1" onPress={() => sheet.snapTo(1)} />
							<Button label="close" testID="motion-sheet-close" onPress={sheet.close} />
						</View>
					</SheetBody>
				</Transition.Motion>
			</View>

			<View style={StyleSheet.absoluteFill} pointerEvents="box-none">
				<Transition.Presence
					open={presenceOpen}
					onRequestClose={() => setPresenceOpen(false)}
					options={{
						...sheetOptions,
						snapPoints: ["auto"],
						onOpen: () => setPresenceStatus("open"),
						onClose: () => setPresenceStatus("closed"),
					}}
				>
					<PresenceBody onMount={setPresenceMounted} onDone={() => setPresenceOpen(false)} />
				</Transition.Presence>
			</View>
			<SpamBar
				buttons={[
					{ id: "bar-sheet-open", label: "sheet +", onPress: () => (bridge.note("sheet", "open"), sheet.open()) },
					{ id: "bar-sheet-close", label: "sheet −", onPress: () => (bridge.note("sheet", "closed"), sheet.close()) },
					{ id: "bar-presence-open", label: "presence +", onPress: () => (bridge.note("presence", "open"), setPresenceOpen(true)) },
					{ id: "bar-presence-close", label: "presence −", onPress: () => (bridge.note("presence", "closed"), setPresenceOpen(false)) },
				]}
			/>
		</View>
	);
}

function PresenceBody({ onMount, onDone }) {
	// Reports mounting and unmounting, so the probe shows Presence removed it after closing.
	useEffect(() => {
		onMount(true);
		return () => onMount(false);
	}, [onMount]);
	return (
		<SheetBody testID="motion-presence-body" title="Presence" full={false}>
			<ScreenReporter routeKey="presence" name="presence" />
			<Text style={{ color: "#ccc" }}>Sized to its content ("auto"). Mounted only while presented.</Text>
			<Button label="done" testID="motion-presence-done" onPress={onDone} />
		</SheetBody>
	);
}

export const lab: Lab = {
	id: "motion",
	title: "motion",
	covers: "useMotion pager (snap points as pages, no dismissal), useMotion sheet (open/close/snapTo, drag + backdrop dismiss), Transition.Presence with an auto snap point",
	Component,
};
