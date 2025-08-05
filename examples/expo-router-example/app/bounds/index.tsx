import type { Href } from "expo-router";
import { Card } from "@/components/card";
import Page from "@/components/page";

type PresetType = {
	title: string;
	description: string;
	href: Href;
	sharedBoundTag?: string;
};

const presets: PresetType[] = [
	{
		title: "Page Transition",
		description: "Use bounds to create a simple page transition.",
		href: "/bounds/page-transition" as const,
		sharedBoundTag: "page-transition",
	},
	{
		title: "Active Bounds",
		description:
			"Learn how to identify and animate the currently active bound among multiple candidates.",
		href: "/bounds/active-bounds" as const,
		sharedBoundTag: "active-bounds",
	},
	{
		title: "Gesture-Assisted",
		description:
			"Use gestures to drive transition progress while bounds preserve visual continuity between screens.",
		href: "/bounds/gesture-assisted" as const,
		sharedBoundTag: "gesture-bounds",
	},
	{
		title: "Bounds + Style Id",
		description:
			"Learn how to animate multiple components on a screen with styleId.",
		href: "/bounds/style-id" as const,
	},
] as const;

export default function Presets() {
	return (
		<Page
			title="Bounds"
			description="Bounds capture component dimensions for use in animations, providing a way to create smooth transitions between screens."
			backIcon="chevron-left"
		>
			{presets.map((preset, idx) => (
				<Card.Aware
					key={idx.toString()}
					title={preset.title}
					description={preset.description}
					sharedBoundTag={preset.sharedBoundTag}
					href={preset.href}
				/>
			))}
		</Page>
	);
}
