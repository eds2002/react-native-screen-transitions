/**
 * Resolves which boundary node owns portal movement. Regular boundaries let a
 * nested target take ownership; Boundary.ClipView always moves its complete
 * fixed host while the nested target remains measurement-only.
 */
export const resolveBoundaryPortalRenderOwnership = ({
	escapeClipping,
	handoffEnabled,
	hasActiveTarget,
	wholeHostPortal,
}: {
	escapeClipping: boolean;
	handoffEnabled: boolean;
	hasActiveTarget: boolean;
	wholeHostPortal: boolean;
}) => ({
	shouldRenderBoundaryRootThroughPortal:
		escapeClipping && (wholeHostPortal || !hasActiveTarget),
	shouldRenderHandoffHost:
		handoffEnabled && (wholeHostPortal || !hasActiveTarget),
});
