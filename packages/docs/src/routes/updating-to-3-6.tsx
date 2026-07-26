import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/updating-to-3-6")({
	beforeLoad: () => {
		throw redirect({
			params: { slug: "updating-to-3-6" },
			to: "/changelog/$slug",
		});
	},
});
