import { makeMutable } from "react-native-reanimated";

export const ZOOM_GROUP = "zoom-sync";

export type BoundsSyncZoomItem = {
	id: string;
	title: string;
	subtitle: string;
	color: string;
	bgColor: string;
	description: string;
	cols: 1 | 2;
	height: number;
};

export const BOUNDS_SYNC_ZOOM_ITEMS: BoundsSyncZoomItem[] = [
	{
		id: "electric",
		title: "Electric Violet",
		subtitle: "Bold purple energy",
		color: "#7C3AED",
		bgColor: "#160B2E",
		description:
			"A punchy, saturated violet that demands attention. Use it for primary actions, hero gradients, and anything that needs to pop off the screen with confidence.",
		cols: 1,
		height: 170,
	},
	{
		id: "coral",
		title: "Hot Coral",
		subtitle: "Fiery pink-red",
		color: "#FF5757",
		bgColor: "#2E0E0E",
		description:
			"An unapologetically bold coral-red that radiates warmth and urgency. Perfect for destructive actions, sale badges, and notifications that can't be ignored.",
		cols: 1,
		height: 170,
	},
	{
		id: "cyan",
		title: "Cyber Cyan",
		subtitle: "Neon-tinted blue",
		color: "#22D3EE",
		bgColor: "#082A30",
		description:
			"A vivid cyan pulled straight from a neon sign. It electrifies dark UIs, makes links unmissable, and pairs beautifully with deep navy or charcoal.",
		cols: 2,
		height: 120,
	},
	{
		id: "emerald",
		title: "Emerald Rush",
		subtitle: "Rich saturated green",
		color: "#10B981",
		bgColor: "#052E20",
		description:
			"A lush, jewel-toned green that feels alive. Ideal for success states, financial UIs, progress bars, and anything that should scream growth and positivity.",
		cols: 1,
		height: 260,
	},
	{
		id: "tangerine",
		title: "Tangerine Pop",
		subtitle: "Juicy warm orange",
		color: "#FF8C00",
		bgColor: "#2E1A00",
		description:
			"Bright, juicy, and impossible to miss. Tangerine brings instant energy to warning states, onboarding highlights, and playful UI moments.",
		cols: 1,
		height: 110,
	},
	{
		id: "sunshine",
		title: "Sunshine",
		subtitle: "Vivid golden yellow",
		color: "#FACC15",
		bgColor: "#2E2606",
		description:
			"A rich, saturated gold that radiates optimism. Use it for star ratings, premium badges, featured labels, and anywhere you need instant cheerfulness.",
		cols: 1,
		height: 90,
	},
	{
		id: "indigo",
		title: "Deep Indigo",
		subtitle: "Rich blue-violet",
		color: "#6366F1",
		bgColor: "#111238",
		description:
			"Sitting right between blue and purple, indigo carries creative depth. Ideal for branded surfaces, selection rings, and focused states that feel premium.",
		cols: 1,
		height: 140,
	},
	{
		id: "fuchsia",
		title: "Fuchsia Burst",
		subtitle: "Vivid magenta pink",
		color: "#E534AB",
		bgColor: "#2E0A22",
		description:
			"An electrifying magenta-pink that refuses to blend in. Use for creative apps, music players, and anywhere you want maximum visual impact with a playful edge.",
		cols: 2,
		height: 200,
	},
	{
		id: "lime",
		title: "Acid Lime",
		subtitle: "Sharp electric green",
		color: "#84CC16",
		bgColor: "#1A2E06",
		description:
			"A sharp, almost neon green-yellow that cuts through dark backgrounds like a laser. Great for gaming UIs, status indicators, and tech-forward interfaces.",
		cols: 1,
		height: 130,
	},
	{
		id: "sky",
		title: "Vivid Sky",
		subtitle: "Bright clear blue",
		color: "#38BDF8",
		bgColor: "#0A2038",
		description:
			"A crisp, saturated sky blue that feels modern and trustworthy. Perfect for links, info cards, onboarding illustrations, and anything that should feel open and inviting.",
		cols: 1,
		height: 220,
	},
];

export const activeZoomId = makeMutable(BOUNDS_SYNC_ZOOM_ITEMS[0].id);

export const getBoundsSyncZoomItemById = (id: string | undefined) => {
	if (!id) return BOUNDS_SYNC_ZOOM_ITEMS[0];
	return (
		BOUNDS_SYNC_ZOOM_ITEMS.find((item) => item.id === id) ??
		BOUNDS_SYNC_ZOOM_ITEMS[0]
	);
};
