import { useNavigation } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition, { snapTo } from "react-native-screen-transitions";
import { SnapIndexProbe } from "@/components/maestro/snap-index-probe";
import { activeMaestroBoundId } from "./options";

type ButtonTone = "primary" | "secondary" | "danger";

const pushFixture = (route: string) => {
	router.push(`/maestro/${route}` as never);
};

function FixtureScreen({
	testID,
	title,
	subtitle,
	children,
}: {
	testID: string;
	title: string;
	subtitle?: string;
	children: React.ReactNode;
}) {
	return (
		<SafeAreaView testID={testID} style={styles.screen}>
			<ScrollView contentContainerStyle={styles.content}>
				<View style={styles.header}>
					<Text style={styles.kicker}>maestro fixture</Text>
					<Text style={styles.title}>{title}</Text>
					{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
				</View>
				{children}
			</ScrollView>
		</SafeAreaView>
	);
}

function SheetFrame({
	testID,
	title,
	subtitle,
	autoHeight = false,
	children,
}: {
	testID: string;
	title: string;
	subtitle?: string;
	autoHeight?: boolean;
	children: React.ReactNode;
}) {
	const { height } = useWindowDimensions();

	return (
		<View
			testID={testID}
			style={[styles.sheet, autoHeight ? null : { minHeight: height }]}
		>
			<View style={styles.handle} />
			<Text style={styles.sheetTitle}>{title}</Text>
			{subtitle ? <Text style={styles.sheetSubtitle}>{subtitle}</Text> : null}
			{children}
		</View>
	);
}

function ActionButton({
	id,
	label,
	onPress,
	tone = "primary",
}: {
	id: string;
	label: string;
	onPress: () => void;
	tone?: ButtonTone;
}) {
	return (
		<Pressable
			testID={id}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				styles[`${tone}Button`],
				pressed && styles.buttonPressed,
			]}
		>
			<Text style={styles.buttonText}>{label}</Text>
		</Pressable>
	);
}

function ProbeText({ id, value }: { id: string; value: string }) {
	return (
		<Text testID={id} style={styles.probe}>
			{value}
		</Text>
	);
}

function ButtonGrid({ children }: { children: React.ReactNode }) {
	return <View style={styles.buttonGrid}>{children}</View>;
}

export function MaestroIndexFixture() {
	return (
		<FixtureScreen
			testID="maestro-index"
			title="Dedicated Screen Transition Fixtures"
			subtitle="These routes are deterministic e2e harnesses, not playground pages."
		>
			<ButtonGrid>
				{[
					["navigation", "Navigation"],
					["pointer-events", "Pointer events"],
					["swipe", "Swipe gestures"],
					["pinch", "Pinch gestures"],
					["gesture-enablement", "Gesture enablement"],
					["snap-points", "Snap points"],
					["sheet-directions", "Sheet directions"],
					["auto-snap", "Auto snap"],
					["programmatic-snap", "Programmatic snap"],
					["snap-lock", "Snap lock"],
					["multi-axis-snap", "Multi-axis snap"],
					["scroll-handoff", "Scroll handoff"],
					["gesture-ownership", "Gesture ownership"],
					["backdrop", "Backdrop"],
					["overlay", "Overlay"],
					["bounds", "Bounds"],
				].map(([route, label]) => (
					<ActionButton
						key={route}
						id={`maestro-open-${route}`}
						label={label}
						onPress={() => pushFixture(route)}
						tone="secondary"
					/>
				))}
			</ButtonGrid>
		</FixtureScreen>
	);
}

export function NavigationFixture() {
	const [count, setCount] = useState(0);

	return (
		<FixtureScreen
			testID="maestro-navigation-home"
			title="Navigation A"
			subtitle="Push and pop inside a route-local stack."
		>
			<ProbeText id="maestro-navigation-count" value={`a-count:${count}`} />
			<ButtonGrid>
				<ActionButton
					id="maestro-navigation-push-detail"
					label="Push B"
					onPress={() => pushFixture("navigation-detail")}
				/>
				<ActionButton
					id="maestro-navigation-push-chain"
					label="Push B for chain"
					onPress={() => pushFixture("navigation-detail")}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-navigation-touch-a"
					label="Touch A"
					onPress={() => setCount((value) => value + 1)}
					tone="secondary"
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

export function NavigationDetailFixture() {
	return (
		<FixtureScreen
			testID="maestro-navigation-detail"
			title="Navigation B"
			subtitle="The pushed screen remains interactive."
		>
			<ButtonGrid>
				<ActionButton
					id="maestro-navigation-push-third"
					label="Push C"
					onPress={() => pushFixture("navigation-third")}
				/>
				<ActionButton
					id="maestro-navigation-back"
					label="Back to A"
					onPress={() => router.back()}
					tone="secondary"
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

export function NavigationThirdFixture() {
	return (
		<FixtureScreen
			testID="maestro-navigation-third"
			title="Navigation C"
			subtitle="Back should return to B, not skip to A."
		>
			<ActionButton
				id="maestro-navigation-third-back"
				label="Back to B"
				onPress={() => router.back()}
			/>
		</FixtureScreen>
	);
}

export function PointerEventsFixture() {
	const [underlayCount, setUnderlayCount] = useState(0);

	return (
		<FixtureScreen
			testID="maestro-pointer-home"
			title="Pointer Events A"
			subtitle="The old screen must regain touches after the top screen unmounts."
		>
			<ProbeText
				id="maestro-pointer-underlay-count"
				value={`underlay-count:${underlayCount}`}
			/>
			<ButtonGrid>
				<ActionButton
					id="maestro-pointer-open-detail"
					label="Open B"
					onPress={() => pushFixture("pointer-events-detail")}
				/>
				<ActionButton
					id="maestro-pointer-underlay"
					label="Underlay touch target"
					onPress={() => setUnderlayCount((value) => value + 1)}
					tone="secondary"
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

export function PointerEventsDetailFixture() {
	const [topCount, setTopCount] = useState(0);

	return (
		<FixtureScreen
			testID="maestro-pointer-detail"
			title="Pointer Events B"
			subtitle="This control should disappear after dismissal."
		>
			<ProbeText id="maestro-pointer-top-count" value={`top-count:${topCount}`} />
			<ButtonGrid>
				<ActionButton
					id="maestro-pointer-stale-target"
					label="Top touch target"
					onPress={() => setTopCount((value) => value + 1)}
				/>
				<ActionButton
					id="maestro-pointer-close"
					label="Dismiss B"
					onPress={() => router.back()}
					tone="secondary"
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

export function SwipeFixture() {
	return (
		<FixtureScreen
			testID="maestro-swipe-host"
			title="Swipe Gesture Host"
			subtitle="Each button pushes one isolated gesture screen."
		>
			<ButtonGrid>
				<ActionButton
					id="maestro-swipe-open-horizontal"
					label="Horizontal"
					onPress={() => pushFixture("swipe-horizontal")}
				/>
				<ActionButton
					id="maestro-swipe-open-horizontal-inverted"
					label="Horizontal inverted"
					onPress={() => pushFixture("swipe-horizontal-inverted")}
				/>
				<ActionButton
					id="maestro-swipe-open-vertical"
					label="Vertical"
					onPress={() => pushFixture("swipe-vertical")}
				/>
				<ActionButton
					id="maestro-swipe-open-vertical-inverted"
					label="Vertical inverted"
					onPress={() => pushFixture("swipe-vertical-inverted")}
				/>
				<ActionButton
					id="maestro-swipe-open-wrong-axis"
					label="Wrong axis guard"
					onPress={() => pushFixture("swipe-wrong-axis")}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-swipe-open-short"
					label="Short swipe guard"
					onPress={() => pushFixture("swipe-short")}
					tone="secondary"
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

function SwipeLeaf({ id, title }: { id: string; title: string }) {
	return (
		<FixtureScreen
			testID={`maestro-${id}`}
			title={title}
			subtitle="Swipe in the configured direction to return to the host."
		>
			<ActionButton
				id={`maestro-${id}-close`}
				label="Close"
				onPress={() => router.back()}
				tone="secondary"
			/>
		</FixtureScreen>
	);
}

export const SwipeHorizontalFixture = () => (
	<SwipeLeaf id="swipe-horizontal" title="Horizontal Swipe" />
);
export const SwipeHorizontalInvertedFixture = () => (
	<SwipeLeaf id="swipe-horizontal-inverted" title="Horizontal Inverted Swipe" />
);
export const SwipeVerticalFixture = () => (
	<SwipeLeaf id="swipe-vertical" title="Vertical Swipe" />
);
export const SwipeVerticalInvertedFixture = () => (
	<SwipeLeaf id="swipe-vertical-inverted" title="Vertical Inverted Swipe" />
);
export const SwipeWrongAxisFixture = () => (
	<SwipeLeaf id="swipe-wrong-axis" title="Wrong Axis Guard" />
);
export const SwipeShortFixture = () => (
	<SwipeLeaf id="swipe-short" title="Short Swipe Guard" />
);

export function PinchFixture() {
	return (
		<FixtureScreen
			testID="maestro-pinch-host"
			title="Pinch Gesture Host"
			subtitle="Maestro 2.0.10 has no pinch command, so the flow guards one-finger leakage."
		>
			<ButtonGrid>
				<ActionButton
					id="maestro-pinch-open-in"
					label="Pinch in"
					onPress={() => pushFixture("pinch-in")}
				/>
				<ActionButton
					id="maestro-pinch-open-out"
					label="Pinch out"
					onPress={() => pushFixture("pinch-out")}
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

function PinchLeaf({ id, title }: { id: string; title: string }) {
	return (
		<FixtureScreen
			testID={`maestro-${id}`}
			title={title}
			subtitle="A one-finger swipe must not dismiss a pinch-only screen."
		>
			<ActionButton
				id={`maestro-${id}-close`}
				label="Close"
				onPress={() => router.back()}
				tone="secondary"
			/>
		</FixtureScreen>
	);
}

export const PinchInFixture = () => (
	<PinchLeaf id="pinch-in" title="Pinch In Screen" />
);
export const PinchOutFixture = () => (
	<PinchLeaf id="pinch-out" title="Pinch Out Screen" />
);

export function GestureEnablementFixture() {
	return (
		<FixtureScreen
			testID="maestro-gesture-enablement-host"
			title="Gesture Enablement"
			subtitle="Disabled and edge-only gestures are isolated from parent routes."
		>
			<ButtonGrid>
				<ActionButton
					id="maestro-gesture-open-disabled"
					label="Disabled gesture"
					onPress={() => pushFixture("gesture-disabled")}
				/>
				<ActionButton
					id="maestro-gesture-open-edge"
					label="Edge gesture"
					onPress={() => pushFixture("gesture-edge")}
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

export const GestureDisabledFixture = () => (
	<SwipeLeaf id="gesture-disabled" title="Disabled Gesture Screen" />
);
export const GestureEdgeFixture = () => (
	<SwipeLeaf id="gesture-edge" title="Edge Gesture Screen" />
);

export function SnapPointsFixture() {
	return (
		<FixtureScreen
			testID="maestro-snap-points-host"
			title="Snap Points"
			subtitle="Opens a route-local sheet with numeric snap points."
		>
			<ActionButton
				id="maestro-snap-open-sheet"
				label="Open snap sheet"
				onPress={() => pushFixture("snap-points-sheet")}
			/>
		</FixtureScreen>
	);
}

export function SnapPointsSheetFixture() {
	return (
		<SheetFrame
			testID="maestro-snap-sheet"
			title="Snap Sheet"
			subtitle="Initial index is 1 in [0.35, 0.65, 1]."
		>
			<SnapIndexProbe testID="maestro-snap-index" />
			<View style={styles.card}>
				<Text style={styles.cardTitle}>Gesture targets</Text>
				<Text style={styles.cardText}>
					Strong vertical swipes should move between snap points. Horizontal
					swipes should leave the snap index alone.
				</Text>
			</View>
			<ActionButton
				id="maestro-snap-close"
				label="Close"
				onPress={() => router.back()}
				tone="secondary"
			/>
		</SheetFrame>
	);
}

export function SheetDirectionsFixture() {
	return (
		<FixtureScreen
			testID="maestro-sheet-directions-host"
			title="Sheet Directions"
			subtitle="Dedicated bottom and right-origin sheets."
		>
			<ButtonGrid>
				<ActionButton
					id="maestro-sheet-open-bottom"
					label="Bottom sheet"
					onPress={() => pushFixture("sheet-bottom")}
				/>
				<ActionButton
					id="maestro-sheet-open-right"
					label="Right sheet"
					onPress={() => pushFixture("sheet-right")}
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

export function SheetBottomFixture() {
	return (
		<SheetFrame testID="maestro-sheet-bottom" title="Bottom Origin Sheet">
			<SnapIndexProbe testID="maestro-sheet-bottom-index" />
			<ActionButton
				id="maestro-sheet-bottom-close"
				label="Close"
				onPress={() => router.back()}
				tone="secondary"
			/>
		</SheetFrame>
	);
}

export function SheetRightFixture() {
	return (
		<SheetFrame testID="maestro-sheet-right" title="Right Origin Sheet">
			<SnapIndexProbe testID="maestro-sheet-right-index" />
			<ActionButton
				id="maestro-sheet-right-close"
				label="Close"
				onPress={() => router.back()}
				tone="secondary"
			/>
		</SheetFrame>
	);
}

export function AutoSnapFixture() {
	return (
		<FixtureScreen
			testID="maestro-auto-snap-host"
			title="Auto Snap"
			subtitle="Auto snap uses a measured-content fixture."
		>
			<ActionButton
				id="maestro-auto-open-sheet"
				label="Open auto sheet"
				onPress={() => pushFixture("auto-snap-sheet")}
			/>
		</FixtureScreen>
	);
}

export function AutoSnapSheetFixture() {
	const [expanded, setExpanded] = useState(false);
	const [contentLayout, setContentLayout] = useState("unmeasured");

	return (
		<SheetFrame
			testID="maestro-auto-sheet"
			title="Auto Snap Sheet"
			subtitle="Auto height is driven by the visible content block."
			autoHeight
		>
			<SnapIndexProbe testID="maestro-auto-index" />
			<ProbeText
				id="maestro-auto-content-layout"
				value={`content-layout:${contentLayout}`}
			/>
			<View
				testID="maestro-auto-content"
				style={[styles.autoBox, expanded && styles.autoBoxExpanded]}
				onLayout={({ nativeEvent }) => {
					setContentLayout(
						nativeEvent.layout.height >= 150 ? "expanded" : "compact",
					);
				}}
			>
				<Text style={styles.cardTitle}>
					{expanded ? "Expanded measured content" : "Compact measured content"}
				</Text>
			</View>
			<ButtonGrid>
				<ActionButton
					id="maestro-auto-toggle-content"
					label="Toggle content height"
					onPress={() => setExpanded((value) => !value)}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-auto-snap-full"
					label="Snap full"
					onPress={() => snapTo(1)}
				/>
				<ActionButton
					id="maestro-auto-snap-auto"
					label="Snap auto"
					onPress={() => snapTo(0)}
					tone="secondary"
				/>
			</ButtonGrid>
		</SheetFrame>
	);
}

export function ProgrammaticSnapFixture() {
	return (
		<FixtureScreen
			testID="maestro-programmatic-snap-host"
			title="Programmatic Snap"
			subtitle="snapTo should update target snap state from visible actions."
		>
			<ActionButton
				id="maestro-programmatic-open-sheet"
				label="Open programmatic sheet"
				onPress={() => pushFixture("programmatic-snap-sheet")}
			/>
		</FixtureScreen>
	);
}

export function ProgrammaticSnapSheetFixture() {
	return (
		<SheetFrame
			testID="maestro-programmatic-sheet"
			title="Programmatic Snap Sheet"
			subtitle="Initial index is 1 in [0.3, 0.6, 1]."
		>
			<SnapIndexProbe testID="maestro-programmatic-index" />
			<ButtonGrid>
				<ActionButton
					id="maestro-programmatic-snap-0"
					label="Snap 0"
					onPress={() => snapTo(0)}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-programmatic-snap-1"
					label="Snap 1"
					onPress={() => snapTo(1)}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-programmatic-snap-2"
					label="Snap 2"
					onPress={() => snapTo(2)}
				/>
			</ButtonGrid>
		</SheetFrame>
	);
}

export function SnapLockFixture() {
	return (
		<FixtureScreen
			testID="maestro-snap-lock-host"
			title="Snap Lock"
			subtitle="Runtime lock changes are scoped to this sheet."
		>
			<ActionButton
				id="maestro-snap-lock-open-sheet"
				label="Open locked sheet"
				onPress={() => pushFixture("snap-lock-sheet")}
			/>
		</FixtureScreen>
	);
}

export function SnapLockSheetFixture() {
	const navigation = useNavigation<any>();
	const [locked, setLocked] = useState(true);

	useEffect(() => {
		navigation.setOptions({ gestureSnapLocked: locked });
	}, [locked, navigation]);

	return (
		<SheetFrame
			testID="maestro-snap-lock-sheet"
			title="Snap Lock Sheet"
			subtitle="Swipe movement is locked until the fixture unlocks it."
		>
			<SnapIndexProbe testID="maestro-snap-lock-index" />
			<ProbeText
				id="maestro-snap-lock-state"
				value={locked ? "snap-lock:locked" : "snap-lock:unlocked"}
			/>
			<ButtonGrid>
				<ActionButton
					id="maestro-snap-lock-toggle"
					label={locked ? "Unlock" : "Lock"}
					onPress={() => setLocked((value) => !value)}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-snap-lock-snap-0"
					label="Snap 0"
					onPress={() => snapTo(0)}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-snap-lock-snap-2"
					label="Snap 2"
					onPress={() => snapTo(2)}
				/>
			</ButtonGrid>
		</SheetFrame>
	);
}

export function MultiAxisSnapFixture() {
	return (
		<FixtureScreen
			testID="maestro-multi-axis-host"
			title="Multi-Axis Snap"
			subtitle="The sheet accepts horizontal and vertical-inverted claims."
		>
			<ActionButton
				id="maestro-multi-axis-open-sheet"
				label="Open multi-axis sheet"
				onPress={() => pushFixture("multi-axis-snap-sheet")}
			/>
		</FixtureScreen>
	);
}

export function MultiAxisSnapSheetFixture() {
	return (
		<SheetFrame testID="maestro-multi-axis-sheet" title="Multi-Axis Sheet">
			<SnapIndexProbe testID="maestro-multi-axis-index" />
			<ActionButton
				id="maestro-multi-axis-close"
				label="Close"
				onPress={() => router.back()}
				tone="secondary"
			/>
		</SheetFrame>
	);
}

export function ScrollHandoffFixture() {
	return (
		<FixtureScreen
			testID="maestro-scroll-handoff-host"
			title="Scroll Handoff"
			subtitle="Nested Transition.ScrollView inside a snap sheet."
		>
			<ActionButton
				id="maestro-scroll-open-sheet"
				label="Open scroll sheet"
				onPress={() => pushFixture("scroll-handoff-sheet")}
			/>
		</FixtureScreen>
	);
}

export function ScrollHandoffSheetFixture() {
	return (
		<SheetFrame testID="maestro-scroll-sheet" title="Scroll Handoff Sheet">
			<SnapIndexProbe testID="maestro-scroll-index" />
			<Transition.ScrollView
				testID="maestro-scroll-list"
				style={styles.fixtureScroll}
				contentContainerStyle={styles.fixtureScrollContent}
			>
				{Array.from({ length: 24 }, (_, index) => (
					<View
						key={index}
						testID={`maestro-scroll-row-${index + 1}`}
						style={styles.row}
					>
						<Text style={styles.rowTitle}>Scroll row {index + 1}</Text>
					</View>
				))}
			</Transition.ScrollView>
		</SheetFrame>
	);
}

export function GestureOwnershipFixture() {
	const [childVisible, setChildVisible] = useState(true);

	return (
		<FixtureScreen
			testID="maestro-ownership-host"
			title="Gesture Ownership"
			subtitle="Nested scroll owners should keep parent dismiss gestures from stealing their axis."
		>
			<ProbeText
				id="maestro-ownership-child-state"
				value={childVisible ? "child:mounted" : "child:unmounted"}
			/>
			{childVisible ? (
				<Transition.ScrollView
					testID="maestro-ownership-horizontal-child"
					horizontal
					style={styles.horizontalScroller}
					contentContainerStyle={styles.horizontalScrollerContent}
				>
					{Array.from({ length: 6 }, (_, index) => (
						<View key={index} style={styles.horizontalCard}>
							<Text style={styles.cardTitle}>Child {index + 1}</Text>
						</View>
					))}
				</Transition.ScrollView>
			) : null}
			<ButtonGrid>
				<ActionButton
					id="maestro-ownership-toggle-child"
					label={childVisible ? "Unmount child owner" : "Mount child owner"}
					onPress={() => setChildVisible((value) => !value)}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-ownership-open-sheet"
					label="Open owned snap sheet"
					onPress={() => pushFixture("gesture-owner-sheet")}
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

export function GestureOwnerSheetFixture() {
	return (
		<SheetFrame testID="maestro-owner-sheet" title="Owned Snap Sheet">
			<SnapIndexProbe testID="maestro-owner-sheet-index" />
			<ActionButton
				id="maestro-owner-sheet-close"
				label="Close"
				onPress={() => router.back()}
				tone="secondary"
			/>
		</SheetFrame>
	);
}

export function BackdropFixture() {
	const [underlayCount, setUnderlayCount] = useState(0);

	return (
		<FixtureScreen
			testID="maestro-backdrop-host"
			title="Backdrop Host"
			subtitle="The underlay counter proves block, dismiss, and passthrough behavior."
		>
			<ProbeText
				id="maestro-backdrop-underlay-count"
				value={`underlay-count:${underlayCount}`}
			/>
			<ActionButton
				id="maestro-backdrop-underlay"
				label="Underlay button"
				onPress={() => setUnderlayCount((value) => value + 1)}
				tone="secondary"
			/>
			<ButtonGrid>
				<ActionButton
					id="maestro-backdrop-open-dismiss"
					label="Dismiss backdrop"
					onPress={() => pushFixture("backdrop-dismiss")}
				/>
				<ActionButton
					id="maestro-backdrop-open-collapse"
					label="Collapse backdrop"
					onPress={() => pushFixture("backdrop-collapse")}
				/>
				<ActionButton
					id="maestro-backdrop-open-block"
					label="Block backdrop"
					onPress={() => pushFixture("backdrop-block")}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-backdrop-open-passthrough"
					label="Passthrough backdrop"
					onPress={() => pushFixture("backdrop-passthrough")}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-backdrop-open-custom"
					label="Custom backdrop"
					onPress={() => pushFixture("backdrop-custom")}
				/>
				<ActionButton
					id="maestro-backdrop-visible-underlay"
					label="Backdrop tap target"
					onPress={() => setUnderlayCount((value) => value + 1)}
					tone="secondary"
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

function BackdropSheet({ id, title }: { id: string; title: string }) {
	return (
		<SheetFrame testID={`maestro-${id}`} title={title}>
			<SnapIndexProbe testID={`maestro-${id}-index`} />
			<ActionButton
				id={`maestro-${id}-close`}
				label="Close"
				onPress={() => router.back()}
				tone="secondary"
			/>
		</SheetFrame>
	);
}

export const BackdropDismissFixture = () => (
	<BackdropSheet id="backdrop-dismiss" title="Dismiss Backdrop Sheet" />
);
export const BackdropCollapseFixture = () => (
	<BackdropSheet id="backdrop-collapse" title="Collapse Backdrop Sheet" />
);
export const BackdropBlockFixture = () => (
	<BackdropSheet id="backdrop-block" title="Block Backdrop Sheet" />
);
export const BackdropPassthroughFixture = () => (
	<BackdropSheet id="backdrop-passthrough" title="Passthrough Backdrop Sheet" />
);
export const BackdropCustomFixture = () => (
	<BackdropSheet id="backdrop-custom" title="Custom Backdrop Sheet" />
);

export function OverlayFixture() {
	const [count, setCount] = useState(0);

	return (
		<FixtureScreen
			testID="maestro-overlay-host"
			title="Overlay Host"
			subtitle="The overlay should remain visible and not block content buttons."
		>
			<ProbeText id="maestro-overlay-count" value={`overlay-count:${count}`} />
			<ButtonGrid>
				<ActionButton
					id="maestro-overlay-touch-content"
					label="Touch content"
					onPress={() => setCount((value) => value + 1)}
					tone="secondary"
				/>
				<ActionButton
					id="maestro-overlay-open-second"
					label="Push overlay second"
					onPress={() => pushFixture("overlay-second")}
				/>
			</ButtonGrid>
		</FixtureScreen>
	);
}

export function OverlaySecondFixture() {
	return (
		<FixtureScreen
			testID="maestro-overlay-second"
			title="Overlay Second"
			subtitle="The overlay route label should follow this screen."
		>
			<ActionButton
				id="maestro-overlay-second-back"
				label="Back"
				onPress={() => router.back()}
			/>
		</FixtureScreen>
	);
}

type BoundItem = "a" | "b";

const boundItems: BoundItem[] = ["a", "b"];

export function BoundsFixture() {
	const [dense, setDense] = useState(false);

	const openItem = (item: BoundItem) => {
		activeMaestroBoundId.value = item;
		router.push({
			pathname: "/maestro/bounds-detail",
			params: { item },
		} as never);
	};

	return (
		<FixtureScreen
			testID="maestro-bounds-host"
			title="Bounds Source"
			subtitle="The active item chooses the shared-bound id for the transition."
		>
			<ProbeText
				id="maestro-bounds-layout-state"
				value={dense ? "layout:dense" : "layout:regular"}
			/>
			<View style={[styles.boundGrid, dense && styles.boundGridDense]}>
				{boundItems.map((item) => (
					<Pressable
						key={item}
						testID={`maestro-bound-open-${item}`}
						onPress={() => openItem(item)}
					>
						<Transition.Boundary.View
							id={`maestro-bound-${item}`}
							style={[
								styles.boundCard,
								item === "b" && styles.boundCardAlt,
								dense && styles.boundCardDense,
							]}
						>
							<Text style={styles.boundText}>source {item}</Text>
						</Transition.Boundary.View>
					</Pressable>
				))}
			</View>
			<ActionButton
				id="maestro-bounds-toggle-layout"
				label="Toggle source layout"
				onPress={() => setDense((value) => !value)}
				tone="secondary"
			/>
		</FixtureScreen>
	);
}

export function BoundsDetailFixture() {
	const params = useLocalSearchParams<{ item?: string }>();
	const item = params.item === "b" ? "b" : "a";

	return (
		<FixtureScreen
			testID="maestro-bounds-detail"
			title="Bounds Destination"
			subtitle={`Destination for item ${item}.`}
		>
			<Transition.Boundary.View
				id={`maestro-bound-${item}`}
				style={[
					styles.boundHero,
					item === "b" && styles.boundCardAlt,
				]}
			>
				<Text
					testID={`maestro-bound-destination-${item}`}
					style={styles.boundHeroText}
				>
					destination {item}
				</Text>
			</Transition.Boundary.View>
			<ActionButton
				id="maestro-bounds-back"
				label="Back to source"
				onPress={() => router.back()}
			/>
		</FixtureScreen>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: "#10141f",
	},
	content: {
		gap: 18,
		padding: 20,
		paddingBottom: 44,
	},
	header: {
		gap: 6,
	},
	kicker: {
		color: "#7dd3fc",
		fontSize: 12,
		fontWeight: "900",
		textTransform: "uppercase",
	},
	title: {
		color: "white",
		fontSize: 28,
		fontWeight: "900",
	},
	subtitle: {
		color: "rgba(255,255,255,0.66)",
		fontSize: 14,
		lineHeight: 20,
	},
	buttonGrid: {
		gap: 10,
	},
	button: {
		alignItems: "center",
		borderRadius: 12,
		minHeight: 48,
		justifyContent: "center",
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	primaryButton: {
		backgroundColor: "#2563eb",
	},
	secondaryButton: {
		backgroundColor: "#273244",
	},
	dangerButton: {
		backgroundColor: "#b91c1c",
	},
	buttonPressed: {
		opacity: 0.72,
	},
	buttonText: {
		color: "white",
		fontSize: 15,
		fontWeight: "800",
		textAlign: "center",
	},
	probe: {
		alignSelf: "flex-start",
		borderRadius: 8,
		backgroundColor: "#1f2937",
		color: "#d1e9ff",
		fontSize: 13,
		fontWeight: "800",
		overflow: "hidden",
		paddingHorizontal: 10,
		paddingVertical: 7,
	},
	sheet: {
		backgroundColor: "#111827",
		borderTopLeftRadius: 22,
		borderTopRightRadius: 22,
		gap: 12,
		paddingHorizontal: 18,
		paddingTop: 12,
		paddingBottom: 28,
	},
	handle: {
		alignSelf: "center",
		backgroundColor: "rgba(255,255,255,0.28)",
		borderRadius: 2,
		height: 4,
		width: 42,
	},
	sheetTitle: {
		color: "white",
		fontSize: 24,
		fontWeight: "900",
	},
	sheetSubtitle: {
		color: "rgba(255,255,255,0.62)",
		fontSize: 13,
		lineHeight: 19,
	},
	card: {
		backgroundColor: "#1f2937",
		borderRadius: 12,
		gap: 6,
		padding: 14,
	},
	cardTitle: {
		color: "white",
		fontSize: 15,
		fontWeight: "900",
	},
	cardText: {
		color: "rgba(255,255,255,0.66)",
		fontSize: 13,
		lineHeight: 18,
	},
	autoBox: {
		backgroundColor: "#334155",
		borderRadius: 12,
		height: 110,
		justifyContent: "center",
		padding: 16,
	},
	autoBoxExpanded: {
		height: 190,
	},
	fixtureScroll: {
		maxHeight: 420,
	},
	fixtureScrollContent: {
		gap: 8,
		paddingBottom: 26,
	},
	row: {
		backgroundColor: "#243044",
		borderRadius: 10,
		padding: 14,
	},
	rowTitle: {
		color: "white",
		fontSize: 14,
		fontWeight: "800",
	},
	horizontalScroller: {
		maxHeight: 130,
	},
	horizontalScrollerContent: {
		gap: 10,
		paddingRight: 20,
	},
	horizontalCard: {
		alignItems: "center",
		backgroundColor: "#243044",
		borderRadius: 12,
		height: 110,
		justifyContent: "center",
		width: 150,
	},
	boundGrid: {
		flexDirection: "row",
		gap: 18,
		minHeight: 210,
	},
	boundGridDense: {
		gap: 8,
		minHeight: 130,
	},
	boundCard: {
		alignItems: "center",
		backgroundColor: "#2563eb",
		borderRadius: 16,
		height: 170,
		justifyContent: "center",
		width: 140,
	},
	boundCardAlt: {
		backgroundColor: "#0d9488",
	},
	boundCardDense: {
		height: 105,
		width: 105,
	},
	boundText: {
		color: "white",
		fontSize: 16,
		fontWeight: "900",
	},
	boundHero: {
		alignItems: "center",
		alignSelf: "center",
		backgroundColor: "#2563eb",
		borderRadius: 24,
		height: 320,
		justifyContent: "center",
		width: "100%",
	},
	boundHeroText: {
		color: "white",
		fontSize: 28,
		fontWeight: "900",
	},
});
