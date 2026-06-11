import { memo } from "react";
import { PortalProvider as NativePortalProvider } from "react-native-teleport";

export const PortalProvider = memo(function PortalProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return <NativePortalProvider>{children}</NativePortalProvider>;
});
