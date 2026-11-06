import {
	type ComponentType,
	createElement,
	forwardRef,
	type ReactNode,
} from "react";
import { Platform } from "react-native";

/**
 * `react-native-teleport` is an optional peer dependency. The require sits in a
 * try/catch so Metro treats it as an optional dependency — an absent module no
 * longer fails the bundle, it throws at runtime and the catch swallows it.
 *
 * When teleport is missing, handoff and escapeClipping boundaries degrade to
 * inline rendering; everything else keeps working.
 */
let mod: any = null;
try {
	mod = require("react-native-teleport");
} catch {}

const SafeNativePortalProvider: ComponentType<{ children: ReactNode }> | null =
	mod?.PortalProvider ?? null;

export const isTeleportAvailable =
	mod !== null && SafeNativePortalProvider !== null;
export const PORTAL_POINTER_EVENTS = "box-none" as const;
/**
 * The portal a boundary renders. On native it is Teleport's `PortalView` itself (the view its
 * `Portal` component renders), registered when the module loads: a boundary drives `hostName` from
 * the UI thread, so the component's React side (its portal-manager subscription, which re-renders
 * every portal whenever any host mounts, and its registration effect) never acts for it and is only
 * cost. Web keeps the component.
 */
const PortalViewHost = forwardRef<unknown, Record<string, unknown>>(
	function PortalViewHost(props, ref) {
		return createElement("PortalView", { ...props, ref });
	},
);
export const NativePortal: ComponentType<any> | null = mod?.Portal
	? Platform.OS === "web"
		? mod.Portal
		: PortalViewHost
	: null;
export const NativePortalProvider: ComponentType<any> | null =
	SafeNativePortalProvider;
export const NativePortalHost: ComponentType<any> | null =
	mod?.PortalHost ?? null;
