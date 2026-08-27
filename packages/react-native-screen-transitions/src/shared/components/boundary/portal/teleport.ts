import type { ComponentType, ReactNode } from "react";

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
export const NativePortal: ComponentType<any> | null = mod?.Portal ?? null;
export const NativePortalProvider: ComponentType<any> | null =
	SafeNativePortalProvider;
export const NativePortalHost: ComponentType<any> | null =
	mod?.PortalHost ?? null;
