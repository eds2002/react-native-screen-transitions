import { memo } from "react";
import { NativePortalProvider } from "../teleport";

export const PortalProvider = memo(function PortalProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	if (!NativePortalProvider) {
		return children;
	}

	return <NativePortalProvider>{children}</NativePortalProvider>;
});
