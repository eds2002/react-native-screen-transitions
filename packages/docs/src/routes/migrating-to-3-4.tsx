import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/migrating-to-3-4")({
	beforeLoad: () => {
		throw redirect({
			params: { slug: "migrating-to-3-4" },
			to: "/changelog/$slug",
		});
	},
});
