import { createModuleMock } from "../helpers/mock-module";
import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { createElement, type ComponentType, type ReactNode } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
	true;

(globalThis as any).__DEV__ = false;

const usePortalDestination = mock(() => ({teleportProps:{},localHostName:"screen:card"}));
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule(
	"../../components/boundary/portal/teleport",
	() => ({
		isTeleportAvailable: true,
		NativePortal: ({ children }: { children: ReactNode }) => children,
		NativePortalHost: (props: any) => createElement("native-host", props),
		NativePortalProvider: null,
		PORTAL_POINTER_EVENTS: "box-none",
	}),
);
await mockModule("../../components/boundary/portal/hooks/use-portal-destination", () => ({usePortalDestination}));
await mockModule(
	"../../components/boundary/portal/hooks/use-placeholder-styles",
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
 const {Portal} = await import("../../components/boundary/portal/components/portal");
 BoundaryPortal = props => createElement(Portal, {...props,mode:"escapeClipping"});
 BoundaryContentPortal = props => createElement(Portal, {...props,mode:"handoff"});
});
beforeEach(() => {usePortalDestination.mockClear();});

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
		expect(usePortalDestination).not.toHaveBeenCalled();
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
		expect(usePortalDestination).not.toHaveBeenCalled();
	});
});

it("mounts the handoff receiver beside the payload without a layout wrapper", () => {
 let renderer: ReactTestRenderer;
 act(() => {renderer=create(<BoundaryContentPortal boundaryId="card" enabled>payload</BoundaryContentPortal>);});
 const output = renderer!.toJSON() as any[];
 expect(output[0]).toBe("payload");
 expect(output[1].type).toBe("native-host");
 expect(output[1].props.name).toBe("screen:card");
 expect(output[1].props.pointerEvents).toBe("box-none");
 act(() => renderer!.unmount());
});
