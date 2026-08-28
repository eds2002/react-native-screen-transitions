import type { ReactNode } from "react";
import { useMemo } from "react";
import type { BaseStackDescriptor } from "../../../types/stack.types";
import createProvider from "../../../utils/create-provider";
import { useBlankStackStore } from "../../stack/blank-stack.provider";
import type { DescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { deriveDescriptorDerivations } from "./helpers/derive-descriptor-derivations";

export type BaseDescriptor = BaseStackDescriptor;

export interface DescriptorsContextValue {
	previous?: BaseDescriptor;
	current: BaseDescriptor;
	next?: BaseDescriptor;
}

export type DescriptorDerivationsContextValue = DescriptorDerivations;

interface DescriptorStoreValue {
	descriptors: DescriptorsContextValue;
	derivations: DescriptorDerivationsContextValue;
	options: BaseDescriptor["options"];
}

type DescriptorsProviderProps = {
	children: ReactNode;
	routeKey: string;
};

const {
	DescriptorsProvider,
	useDescriptorsStore,
	useOptionalDescriptorsStore,
} = createProvider("Descriptors", {
	global: true,
})<DescriptorsProviderProps, DescriptorStoreValue>(({ routeKey, children }) => {
	const scene = useBlankStackStore((s) => s.scenesByKey[routeKey]);

	const currentDescriptor = scene.descriptor;
	const previousDescriptor = scene.previousDescriptor;
	const nextDescriptor = scene.nextDescriptor;
	const options = scene.descriptor.options;

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

	const value = useMemo(() => {
		return {
			descriptors,
			derivations,
			options,
		};
	}, [descriptors, derivations, options]);

	return {
		key: routeKey,
		value,
		children,
	};
});

export {
	DescriptorsProvider,
	useDescriptorsStore,
	useOptionalDescriptorsStore,
};
