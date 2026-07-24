import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { ComponentType, ReactNode } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
	true;

const useBoundaryPortalAttachment = mock(() => ({ teleportProps: {} }));
const useBoundaryContentPortalAttachment = mock(() => ({
	teleportProps: {},
}));

mock.module(
	"../../components/boundary/portal/teleport",
	() => ({
		isTeleportAvailable: true,
		NativePortal: ({ children }: { children: ReactNode }) => children,
		NativePortalHost: null,
		NativePortalProvider: null,
		PORTAL_POINTER_EVENTS: "box-none",
	}),
);
mock.module(
	"../../components/boundary/portal/components/boundary-portal/hooks/use-boundary-portal-attachment",
	() => ({ useBoundaryPortalAttachment }),
);
mock.module(
	"../../components/boundary/portal/components/boundary-content-portal/hooks/use-boundary-content-portal-attachment",
	() => ({ useBoundaryContentPortalAttachment }),
);
mock.module(
	"../../components/boundary/portal/components/boundary-portal/hooks/use-placeholder-styles",
	() => ({
		usePlaceholderStyles: () => ({
			handleOnLayout: () => {},
			placeholderStyle: {},
		}),
	}),
);

let BoundaryPortal: ComponentType<{
	boundaryId: string;
	children: ReactNode;
	enabled: boolean;
}>;
let BoundaryContentPortal: ComponentType<{
	boundaryId?: string;
	children: ReactNode;
	enabled: boolean;
}>;

beforeAll(async () => {
	({ BoundaryPortal } = await import(
		"../../components/boundary/portal/components/boundary-portal"
	));
	({ BoundaryContentPortal } = await import(
		"../../components/boundary/portal/components/boundary-content-portal"
	));
});

beforeEach(() => {
	useBoundaryPortalAttachment.mockClear();
	useBoundaryContentPortalAttachment.mockClear();
});

describe("disabled boundary portals", () => {
	it("renders a boundary portal inline without preparing an attachment", () => {
		let renderer: ReactTestRenderer;

		act(() => {
			renderer = create(
				<BoundaryPortal boundaryId="card" enabled={false}>
					inline content
				</BoundaryPortal>,
			);
		});

		expect(renderer!.toJSON()).toBe("inline content");
		expect(useBoundaryPortalAttachment).not.toHaveBeenCalled();
	});

	it("renders a content portal inline without preparing an attachment", () => {
		let renderer: ReactTestRenderer;

		act(() => {
			renderer = create(
				<BoundaryContentPortal boundaryId="card" enabled={false}>
					inline content
				</BoundaryContentPortal>,
			);
		});

		expect(renderer!.toJSON()).toBe("inline content");
		expect(useBoundaryContentPortalAttachment).not.toHaveBeenCalled();
	});
});
