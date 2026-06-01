declare module "react-native/Libraries/NativeComponent/NativeComponentRegistry" {
	import type { HostComponent } from "react-native";

	export function get<TProps extends object>(
		name: string,
		viewConfigProvider: () => object,
	): HostComponent<TProps>;
}
