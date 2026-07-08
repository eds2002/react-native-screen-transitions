import { type ComponentType, createElement, type ReactNode } from "react";

/**
 * `react-native-teleport` is an optional peer dependency. The require sits in a
 * try/catch so Metro treats it as an optional dependency — an absent module no
 * longer fails the bundle, it throws at runtime and the catch swallows it.
 *
 * When teleport is missing, handoff and escapeClipping boundaries degrade to
 * inline rendering; everything else keeps working.
 */
let mod: any = null;
let managerMod: any = null;
let providerViewMod: any = null;
try {
	mod = require("react-native-teleport");
	managerMod = require("react-native-teleport/lib/module/contexts/PortalManager");
	providerViewMod = require("react-native-teleport/lib/module/views/PortalProvider");
} catch {}

const NativePortalProviderView: ComponentType<{ children: ReactNode }> | null =
	providerViewMod?.default ?? null;
const PortalManagerProvider: ComponentType<{ children: ReactNode }> | null =
	managerMod?.PortalManagerProvider ?? null;

const SafeNativePortalProvider: ComponentType<{ children: ReactNode }> | null =
	PortalManagerProvider
		? ({ children }: { children: ReactNode }) => {
				const managedChildren = createElement(
					PortalManagerProvider,
					null,
					children,
				);

				return NativePortalProviderView
					? createElement(NativePortalProviderView, null, managedChildren)
					: managedChildren;
			}
		: null;

export const isTeleportAvailable =
	mod !== null && SafeNativePortalProvider !== null;
export const NativePortal: ComponentType<any> | null = mod?.Portal ?? null;
export const NativePortalProvider: ComponentType<any> | null =
	SafeNativePortalProvider;
export const NativePortalHost: ComponentType<any> | null =
	mod?.PortalHost ?? null;
