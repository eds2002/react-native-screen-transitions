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
		title: "iOS Card Horizontal",
		description: "Mimicks the default iOS card transition.",
		href: "/custom-transitions/ios-card-horizontal" as const,
	},
	{
		title: "iOS Card Vertical",
		description:
			"Mimicks the default iOS card transition, except it's vertical.",
		href: "/custom-transitions/ios-card-vertical" as const,
	},
	{
		title: "iOS Card with gestures",
		description: "iOS card but with gestures.",
		href: "/custom-transitions/gestures" as const,
	},
	{
		title: "Screen Level Animations",
		description: "Creating more customizable animations per screen.",
		href: "/custom-transitions/screen-level" as const,
	},
] as const;

export default function Presets() {
	return (
		<Page
			title="Custom Presets"
			description="By default, the iOS horizontal animation exists within the native stack. However, it is a great starting point for learning how to create your own custom transitions."
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
