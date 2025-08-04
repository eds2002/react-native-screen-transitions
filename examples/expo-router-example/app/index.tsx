import type { Href } from "expo-router";
import { Card } from "@/components/card";
import Page from "@/components/page";

type PageType = {
	title: string;
	description: string;
	href: Href;
};

const pages: PageType[] = [
	{
		title: "Presets",
		description:
			"Check out the built in presets you can use to get started quickly",
		href: "/presets",
	},
	{
		title: "Creating Transitions",
		description: "Learn how to create your own transitions.",
		href: "/custom-transitions",
	},
	{
		title: "Bounds",
		description: "Learn how bounds work and how to use them.",
		href: "/bounds",
	},
] as const;

export default function Home() {
	return (
		<Page
			title="Home"
			description="Welcome to the expo router example, click on any of the cards below to see the examples."
		>
			{pages.map((page, idx) => (
				<Card
					key={idx.toString()}
					title={page.title}
					description={page.description}
					href={page.href}
				/>
			))}
		</Page>
	);
}
