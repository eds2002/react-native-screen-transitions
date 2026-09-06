import type { ReactNode } from "react";
import { useMemo } from "react";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import type { DescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { deriveDescriptorDerivations } from "./helpers/derive-descriptor-derivations";

import { useScreenTopology } from "./hooks/use-screen-topology";

export type BaseDescriptor = BaseStackDescriptor;

export interface DescriptorsContextValue {
	previous?: BaseDescriptor;
	current: BaseDescriptor;
	next?: BaseDescriptor;
}

export type DescriptorDerivationsContextValue = DescriptorDerivations;

interface BuilderStoreValue {
	descriptors: DescriptorsContextValue;
	derivations: DescriptorDerivationsContextValue;
	options: BaseDescriptor["options"];
}

export type BuilderProviderProps = {
	children: ReactNode;
	routeKey: string;
	descriptors: DescriptorsContextValue;
};

const createBuilderProvider = createProvider("Builder", {
	global: true,
})<BuilderProviderProps, BuilderStoreValue>;

const {
	StoreProvider: BuilderStoreProvider,
	getBuilderStore,
	BuilderProvider,
	useBuilderStore,
	useOptionalBuilderStore,
}: ReturnType<typeof createBuilderProvider> = createBuilderProvider(
	({ routeKey, children, descriptors: inputDescriptors }) => {
		const currentDescriptor = inputDescriptors.current;
		const previousDescriptor = inputDescriptors.previous;
		const nextDescriptor = inputDescriptors.next;
		const options = currentDescriptor.options;

		const descriptors = useMemo(() => {
			return {
				previous: previousDescriptor,
				current: currentDescriptor,
				next: nextDescriptor,
			};
		}, [previousDescriptor, currentDescriptor, nextDescriptor]);

		const derivations = useMemo(() => {
			return deriveDescriptorDerivations({
				previous: previousDescriptor,
				current: currentDescriptor,
				next: nextDescriptor,
			});
		}, [previousDescriptor, currentDescriptor, nextDescriptor]);

		useScreenTopology(routeKey);

		const value = useMemo(
			() => ({ descriptors, derivations, options }),
			[descriptors, derivations, options],
		);

		return {
			key: routeKey,
			value,
			children,
		};
	},
);

export {
	BuilderProvider,
	BuilderStoreProvider,
	getBuilderStore,
	useBuilderStore,
	useOptionalBuilderStore,
};
