import type { Href } from "expo-router";
import { View } from "react-native";
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

const nestedPages: PageType[] = [
	{
		title: "Nested Transitions",
		description: "Create deeply nested animations ( not recommended )",
		href: "/nested/a",
	},
];

export default function Home() {
	return (
		<Page
			title="Expo Router Example"
			description="Hey hello, welcome to the expo router example."
		>
			<View>
				<Page.Group
					title="1. Screen Transitions"
					description="Learn how to use / define your own screen transitions."
				/>
				<View style={{ gap: 24, marginTop: 24 }}>
					{pages.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={page.title}
							description={page.description}
							href={page.href}
						/>
					))}
				</View>
			</View>
			<View>
				<Page.Group
					title="2. Nested Transitions"
					description="Create deeply nested animations ( not recommended )"
				/>
				<View style={{ gap: 24, marginTop: 24 }}>
					{nestedPages.map((page, idx) => (
						<Card
							key={idx.toString()}
							title={page.title}
							description={page.description}
							href={page.href}
						/>
					))}
				</View>
			</View>
		</Page>
	);
}
