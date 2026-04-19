/**
 * Detects whether the app is running on React Native's new architecture (Fabric).
 */
export function isFabric(): boolean {
	return "nativeFabricUIManager" in global;
}
