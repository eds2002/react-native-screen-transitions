import type { ReactNode } from "react";
import { useBuilderStore } from "../../../providers/screen/builder";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import { useCloseTransitionIntent } from "./hooks/use-close-transition-intent";
import { useScreenLifecycle } from "./use-screen-lifecycle";

export function BlankStackLifecycle({ children }: { children: ReactNode }) {
	const current = useBuilderStore((store) => store.descriptors.current);
	const handleOpenRoute = useBlankStackStore((store) => store.handleOpenRoute);

	const { completeClose } = useCloseTransitionIntent(current);

	useScreenLifecycle({
		completeClose,
		completeOpen: () => handleOpenRoute?.({ route: current.route }),
	});

	return children;
}
