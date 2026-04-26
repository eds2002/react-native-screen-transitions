/**
 * Detects whether the app is running on React Native's new architecture (Fabric).
 */
declare const global: typeof globalThis;

export function isFabric(): boolean {
	return "nativeFabricUIManager" in global;
}
