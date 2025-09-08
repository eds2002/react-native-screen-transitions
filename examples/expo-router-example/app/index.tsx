import type { Href } from "expo-router";
import { memo } from "react";
import { View } from "react-native";
import { Card } from "@/components/card";
import Page from "@/components/page";
import { TabStrip } from "@/components/tab-strip";

type PageType = {
	title: string;
	description: string;
	href: Href;
	testID?: string;
};

const tabs = ["Start", "Examples", "E2E"];

const StartComponent = memo(() => {
	const basics: PageType[] = [
		{
			title: "Presets",
			description: "Try built-in transitions like Slide, Zoom, and Elastic.",
			href: "/presets",
		},
		{
			title: "Creating Transitions",
			description: "Compose your own with Reanimated, gestures, and specs.",
			href: "/custom-transitions",
		},
		{
			title: "Bounds",
			description:
				"Use shared bounds to drive transitions from element positions.",
			href: "/bounds",
		},
	] as const;

	const nestedNavigators: PageType[] = [
		{
			title: "Nested Navigators",
			description: "Deeply nested stacks with independent gestures.",
			href: "/nested/a",
		},
	];

	return (
		<View style={{ gap: 32 }}>
			<View>
				<Page.Group
					title="Basics"
					description="Go from using presets to creating your own transitions."
				/>
				<View style={{ gap: 24, marginTop: 24 }}>
					{basics.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={`${page.title}`}
							description={page.description}
							href={page.href}
						/>
					))}
				</View>
			</View>

			<View>
				<Page.Group
					title="Nested Navigators"
					description="See how gestures and transitions work with nested navigators."
				/>
				<View style={{ gap: 24, marginTop: 24 }}>
					{nestedNavigators.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={`${page.title}`}
							description={page.description}
							href={page.href}
						/>
					))}
				</View>
			</View>
		</View>
	);
});

const ExamplesComponent = memo(() => {
	const screenTransitions: PageType[] = [
		{
			title: "Settings Screen",
			description: "Slide from top.",
			href: "/examples/settings-screen/a",
		},
		{
			title: "Settings Modal",
			description: "Modal slide from bottom.",
			href: "/examples/settings-modal/a",
		},
		{
			title: "Delete Warning",
			description: "Slight slide from bottom.",
			href: "/examples/delete-warning",
		},
		{
			title: "Fullscreen Nav",
			description: "Full screen navigation with staggered transitions.",
			href: "/examples/fullscreen-nav",
		},
		{
			title: "Gallery Modal",
			description: "Modal slide from bottom.",
			href: "/examples/gallery-modal",
		},
		{
			title: "Palette Profile",
			description: "Full screen draggable card.",
			href: "/examples/palette-profile",
		},
	] as const;

	const boundsTransitions: PageType[] = [
		{
			title: "Instagram",
			description:
				"Use shared bounds to drive transitions from element positions.",
			href: "/examples/instagram",
		},
		{
			title: "Twitter / X",
			description:
				"Use shared bounds to drive transitions from element positions.",
			href: "/examples/x",
		},
		{
			title: "Apple Music",
			description:
				"Use shared bounds to drive transitions from element positions.",
			href: "/examples/apple-music/(tabs)",
		},
	];

	return (
		<View style={{ gap: 32 }}>
			<View>
				<Page.Group
					title="Simple Transitions"
					description="Foundational animations found across many apps."
				/>
				<View style={{ gap: 24, marginTop: 24 }}>
					{screenTransitions.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={`${page.title}`}
							description={page.description}
							href={page.href}
						/>
					))}
				</View>
			</View>

			<View>
				<Page.Group
					title="Bounds"
					description="See how gestures and transitions work with nested navigators."
				/>
				<View style={{ gap: 24, marginTop: 24 }}>
					{boundsTransitions.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={`${page.title}`}
							description={page.description}
							href={page.href}
						/>
					))}
				</View>
			</View>
		</View>
	);
});

const End2EndComponent = memo(() => {
	const navigation: PageType[] = [
		{
			title: "Push/back navigation",
			description:
				"Should animate when using navigation events such as push/back.",
			href: "/e2e/navigation",
			testID: "e2e-navigation",
		},
	];

	const gestures: PageType[] = [
		{
			title: "Gesture directions",
			description: "Test all gesture directions.",
			href: "/e2e/gestures/all-gesture-directions",
			testID: "e2e-gesture-directions",
		},
		{
			title: "Bi-directional gestures",
			description: "Test bi-directional gesture directions.",
			href: "/e2e/gestures/bi-directional",
			testID: "e2e-bi-directional",
		},
		{
			title: "Gesture dismissal logic (vertical)",
			description:
				"Should dismiss on top-to-bottom swipes, extreme left-to-right/right-to-left swipes. Should reset on bottom-to-top swipes.",
			href: "/e2e/gestures/gesture-dismissal",
			testID: "e2e-gesture-dismissal",
		},
	] as const;

	const scrollables: PageType[] = [
		{
			title: "Scrollable triggers gesture (vertical)",
			description:
				"Should trigger gesture on bottom-to-top at base position and top-to-bottom at end position.",
			href: "/e2e/gestures-scrollables/vertical",
			testID: "e2e-scrollable-vertical",
		},
		{
			title: "Scrollable triggers gesture (horizontal)",
			description:
				"Should trigger gesture on left-to-right at base position and right-to-left at end position.",
			href: "/e2e/gestures-scrollables/horizontal",
			testID: "e2e-scrollable-horizontal",
		},
		{
			title: "Nested Scrollable triggers navigator (vertical)",
			description:
				"Should trigger gesture on left-to-right at base position and right-to-left at end position.",
			href: "/e2e/gestures-scrollables/nested",
			testID: "e2e-scrollable-nested",
		},
	];

	const gestureEdges: PageType[] = [
		{
			title: "All edges",
			description: "Test all edges.",
			href: "/e2e/gesture-edges/all-edges",
			testID: "e2e-gesture-edges-all-edges",
		},
		{
			title: "Custom edges",
			description: "Test custom edges.",
			href: "/e2e/gesture-edges/custom-edges",
			testID: "e2e-gesture-edges-custom-edges",
		},
	];

	const bounds: PageType[] = [
		{
			title: "Anchor point",
			description: "Test anchor points",
			href: "/e2e/bounds/anchor-point",
			testID: "e2e-bounds-anchor-point",
		},
		{
			title: "Custom bounds",
			description: "Test custom defined targets",
			href: "/e2e/bounds/custom-bounds",
			testID: "e2e-bounds-custom-bounds",
		},
		{
			title: "Longer flow",
			description: "Test longer flow",
			href: "/e2e/bounds/longer-flow/a",
			testID: "e2e-bounds-longer-flow",
		},
		{
			title: "List",
			description: "Test list",
			href: "/e2e/bounds/list",
			testID: "e2e-bounds-list",
		},
	];

	const reactnavigation = [
		{
			title: "React Navigation",
			description: "Test React Navigation",
			href: "/e2e/nested",
			testID: "e2e-nested",
		},
	];

	return (
		<View style={{ gap: 32 }}>
			<View>
				<Page.Group title="Navigation" />
				<View style={{ gap: 24, marginTop: 24 }}>
					{navigation.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={`${page.title}`}
							description={page.description}
							href={page.href}
							testID={page.testID}
						/>
					))}
				</View>
			</View>
			<View>
				<Page.Group title="Gestures" />
				<View style={{ gap: 24, marginTop: 24 }}>
					{gestures.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={`${page.title}`}
							description={page.description}
							href={page.href}
							testID={page.testID}
						/>
					))}
				</View>
			</View>
			<View>
				<Page.Group title="Gestures + Scrollables" />
				<View style={{ gap: 24, marginTop: 24 }}>
					{scrollables.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={`${page.title}`}
							description={page.description}
							href={page.href}
							testID={page.testID}
						/>
					))}
				</View>
			</View>
			<View>
				<Page.Group title="Gestures Edges" />
				<View style={{ gap: 24, marginTop: 24 }}>
					{gestureEdges.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={`${page.title}`}
							description={page.description}
							href={page.href}
							testID={page.testID}
						/>
					))}
				</View>
			</View>
			<View>
				<Page.Group title="Bounds" />
				<View style={{ gap: 24, marginTop: 24 }}>
					{bounds.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={`${page.title}`}
							description={page.description}
							href={page.href}
							testID={page.testID}
						/>
					))}
				</View>
			</View>
			<View>
				<Page.Group title="React Navigation" />
				<View style={{ gap: 24, marginTop: 24 }}>
					{reactnavigation.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={`${page.title}`}
							description={page.description}
							href={page.href}
							testID={page.testID}
						/>
					))}
				</View>
			</View>
		</View>
	);
});

export default function Home() {
	return (
		<Page
			title="Screen Transitions"
			description="Build fluid, interruptible transitions with gestures and Reanimated."
			testID="HOME_PAGE"
		>
			<TabStrip
				tabs={tabs}
				colors={{
					Start: "#60a5fa",
					Examples: "#84cc16",
					E2E: "#ec4899",
				}}
				renderScene={(tab) => {
					switch (tab) {
						case "Start":
							return <StartComponent />;
						case "Examples":
							return <ExamplesComponent />;
						case "E2E":
							return <End2EndComponent />;
						default:
							return null;
					}
				}}
			/>
		</Page>
	);
}
