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
						default:
							return null;
					}
				}}
			/>
		</Page>
	);
}
