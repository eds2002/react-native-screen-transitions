export type ScreenTopologyRegistration = {
	screenKey: string;
	navigatorKey?: string;
	parentScreenKey?: string;
	transitionKey?: string;
};

export type ActiveScreenRegistration = {
	parentScreenKey: string;
	screenKey: string;
};

export type ScreenRelationships = Readonly<{
	parentScreenKey: string | null;
	activeChildScreenKey: string | null;
	activeChildNavigatorKey: string | null;
}>;

export type ScreenTopology = {
	register(registration: ScreenTopologyRegistration): void;
	unregister(screenKey: string): void;
	activate(registration: ActiveScreenRegistration): void;
	getRelationships(screenKey: string): ScreenRelationships;
	resolve(screenKey: string, depth: number): string | null;
	registerTransitionSource(
		screenKey: string,
		source: ScreenTransitionSource,
	): void;
	unregisterTransitionSource(screenKey: string): void;
	getTransition(key: string): ScreenTransitionValue | null;
	subscribeTransition(key: string, listener: () => void): () => void;
	subscribe(screenKey: string, listener: () => void): () => void;
	subscribeResolution(listener: () => void): () => void;
};

import type { ScreenTransitionValue } from "../../../types/animation.types";
import type { ScreenTransitionSource } from "../../../types/bounds.types";
