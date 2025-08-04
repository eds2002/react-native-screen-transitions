import type { Href } from "expo-router";
import { Card } from "@/components/card";
import Page from "@/components/page";

type PresetType = {
	title: string;
	description: string;
	href: Href;
};

const presets: PresetType[] = [
	{
		title: "Slide From Top",
		description:
			"Screen slides in from the top with vertical gesture support. Great for modal-like presentations.",
		href: "/presets/slide-from-top" as const,
	},
	{
		title: "Zoom In",
		description:
			"Focused screen zooms in while unfocused screen zooms out with opacity changes. No gesture support.",
		href: "/presets/zoom-in" as const,
	},
	{
		title: "Slide From Bottom",
		description:
			"Screen slides in from the bottom with vertical gesture support. Perfect for bottom sheet style navigation.",
		href: "/presets/slide-from-bottom" as const,
	},
	{
		title: "Draggable Card",
		description:
			"Interactive card that can be dragged horizontally and vertically with scale effects during transition.",
		href: "/presets/draggable-card" as const,
	},
	{
		title: "Elastic Card",
		description:
			"Bidirectional elastic movement with overlay effects. The screen stretches like rubber when dragged.",
		href: "/presets/elastic-card" as const,
	},
] as const;

export default function Presets() {
	return (
		<Page
			title="Animation Presets"
			description="Explore the built-in transition presets. Each preset demonstrates different animation styles and gesture behaviors."
			backIcon="chevron-left"
		>
			{presets.map((preset, idx) => (
				<Card
					key={idx.toString()}
					title={preset.title}
					description={preset.description}
					href={preset.href}
				/>
			))}
		</Page>
	);
}
