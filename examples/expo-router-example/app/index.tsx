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
};

const tabs = ["Start", "Examples", "Debug"];

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
			description: "Inspiration: Family",
			href: "/examples/settings-screen/a",
		},
		{
			title: "Settings Modal",
			description: "Inspiration: Family, Rainbow, Grok",
			href: "/examples/settings-modal/a",
		},
	] as const;

	const boundsTransitions: PageType[] = [
		{
			title: "Instagram",
			description:
				"Use shared bounds to drive transitions from element positions.",
			href: "/bounds",
		},
		{
			title: "Twitter / X",
			description:
				"Use shared bounds to drive transitions from element positions.",
			href: "/bounds",
		},
		{
			title: "TikTok",
			description:
				"Use shared bounds to drive transitions from element positions.",
			href: "/bounds",
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

const DebugComponent = memo(() => {
	const debug: PageType[] = [
		{
			title: "Deeply Nested Scrolls",
			description: "Can nested scrolls dictate the parent navigator gesture",
			href: "/debug/deeply-nested-scrolls",
		},
	] as const;

	return (
		<View style={{ gap: 32 }}>
			<View>
				<Page.Group
					title="Common Issues"
					description="Debugging examples for common issues."
				/>
				<View style={{ gap: 24, marginTop: 24 }}>
					{debug.map((page, idx) => (
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

export default function Home() {
	return (
		<Page
			title="Screen Transitions"
			description="Build fluid, interruptible transitions with gestures and Reanimated."
		>
			<TabStrip
				tabs={tabs}
				colors={{
					Start: "#60a5fa",
					Examples: "#84cc16",
					Debug: "#d1d5db",
				}}
				renderScene={(tab) => {
					switch (tab) {
						case "Start":
							return <StartComponent />;
						case "Examples":
							return <ExamplesComponent />;
						case "Debug":
							return <DebugComponent />;
						default:
							return null;
					}
				}}
			/>
		</Page>
	);
}
