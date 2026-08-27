export type ScreenTopologyRegistration = {
	screenKey: string;
	parentScreenKey?: string;
};

export type ActiveScreenRegistration = {
	parentScreenKey: string;
	screenKey: string;
};

export type ScreenRelationships = Readonly<{
	parentScreenKey: string | null;
	activeChildScreenKey: string | null;
}>;

export type ScreenTopology = {
	register(registration: ScreenTopologyRegistration): void;
	unregister(screenKey: string): void;
	activate(registration: ActiveScreenRegistration): () => void;
	getRelationships(screenKey: string): ScreenRelationships;
	subscribe(screenKey: string, listener: () => void): () => void;
};
