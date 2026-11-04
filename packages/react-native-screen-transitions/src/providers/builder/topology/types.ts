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
	resolveTransitionKey(key: string): string | null;
	subscribe(screenKey: string, listener: () => void): () => void;
	subscribeResolution(listener: () => void): () => void;
};
