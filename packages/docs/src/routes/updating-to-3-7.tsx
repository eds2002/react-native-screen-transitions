import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/updating-to-3-7")({
	beforeLoad: () => {
		throw redirect({
			to: "/changelog/updating-to-3-7",
		});
	},
});
