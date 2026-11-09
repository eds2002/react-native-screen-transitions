import type { ReactNode } from "react";
import { useMemo } from "react";
import type { BaseStackDescriptor } from "../../types/stack.types";
import createProvider from "../../utils/create-provider";
import { useOptionalScreenHostStore } from "../host/screen-host.provider";
import type { DescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { deriveDescriptorDerivations } from "./helpers/derive-descriptor-derivations";
import { useScreenTopology } from "./hooks/use-screen-topology";

export type BaseDescriptor = BaseStackDescriptor;

export interface DescriptorsContextValue {
	previous?: BaseDescriptor;
	current: BaseDescriptor;
	next?: BaseDescriptor;
	/** A screen still closing between current and next (see BaseStackScene.closingNextDescriptor). */
	closingNext?: BaseDescriptor;
}

interface BuilderStoreValue {
	descriptors: DescriptorsContextValue;
	derivations: DescriptorDerivations;
	options: BaseDescriptor["options"];
}

type BuilderProviderProps = {
	children: ReactNode;
	routeKey: string;
	descriptors: DescriptorsContextValue;
	/**
	 * Whether this screen mounts already open. Defaults to the stack rule: the host's first
	 * route, unless `experimental_animateOnInitialMount` is set.
	 */
	startsSettled?: boolean;
};

const createBuilderProvider = createProvider("Builder", {
	global: true,
})<BuilderProviderProps, BuilderStoreValue>;

const {
	getBuilderStore,
	BuilderProvider,
	useBuilderStore,
	useOptionalBuilderStore,
}: ReturnType<typeof createBuilderProvider> = createBuilderProvider(
	({ routeKey, children, descriptors: inputDescriptors, startsSettled }) => {
		const currentDescriptor = inputDescriptors.current;
		const previousDescriptor = inputDescriptors.previous;
		const nextDescriptor = inputDescriptors.next;
		const closingNextDescriptor = inputDescriptors.closingNext;
		const options = currentDescriptor.options;

		const descriptors = useMemo(() => {
			return {
				previous: previousDescriptor,
				current: currentDescriptor,
				next: nextDescriptor,
				closingNext: closingNextDescriptor,
			};
		}, [
			previousDescriptor,
			currentDescriptor,
			nextDescriptor,
			closingNextDescriptor,
		]);

		const firstRouteKey = useOptionalScreenHostStore(
			(store) => store?.firstRouteKey,
		);

		const derivations = useMemo(() => {
			return deriveDescriptorDerivations({
				previous: previousDescriptor,
				current: currentDescriptor,
				next: nextDescriptor,
				firstRouteKey,
				startsSettled,
			});
		}, [
			previousDescriptor,
			currentDescriptor,
			nextDescriptor,
			firstRouteKey,
			startsSettled,
		]);

		useScreenTopology(routeKey, options.transitionKey);

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
	/** A registered screen's builder state (its release on unmount is tested). */
	getBuilderStore,
	useBuilderStore,
	useOptionalBuilderStore,
};
