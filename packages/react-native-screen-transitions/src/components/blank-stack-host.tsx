import { memo, type ReactNode } from "react";
import { PortalProvider } from "./boundary/portal";
import { Overlay } from "./overlay";

export type BlankStackHostProps = {
	children: ReactNode;
};

/**
 * Hosts the portal-backed resources shared by every Blank Stack presentation.
 */
export const BlankStackHost = memo(function BlankStackHost({
	children,
}: BlankStackHostProps) {
	return (
		<PortalProvider>
			<Overlay.Float />
			{children}
		</PortalProvider>
	);
});
