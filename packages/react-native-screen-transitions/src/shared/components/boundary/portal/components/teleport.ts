import type { ComponentType } from "react";

/**
 * `react-native-teleport` is an optional peer dependency. The require sits in a
 * try/catch so Metro treats it as an optional dependency — an absent module no
 * longer fails the bundle, it throws at runtime and the catch swallows it.
 *
 * When teleport is missing, `portal`-enabled boundaries degrade to inline
 * rendering; everything else keeps working.
 */
let mod: any = null;
try {
	mod = require("react-native-teleport");
} catch {}

export const isTeleportAvailable = mod !== null;
export const NativePortal: ComponentType<any> | null = mod?.Portal ?? null;
export const NativePortalProvider: ComponentType<any> | null =
	mod?.PortalProvider ?? null;
export const NativePortalHost: ComponentType<any> | null =
	mod?.PortalHost ?? null;
