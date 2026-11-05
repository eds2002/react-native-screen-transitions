import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import useStableCallback from "../hooks/use-stable-callback";
import { MotionView } from "./motion";
import type { MotionOptions } from "./types";
import { useMotion } from "./use-motion";

export type PresenceProps = {
	/** Mounts and opens the content while true; closes it, then unmounts it, when false. */
	open: boolean;
	/** A gesture or the backdrop dismissed it: set `open` to false here. */
	onRequestClose?: () => void;
	/** The unit's options: snap points, gestures, interpolator, transition spec. */
	options?: Omit<MotionOptions, "initial" | "onRequestClose">;
	children: ReactNode;
};

/**
 * Presents content with a motion unit while `open` is true, and keeps it mounted until its
 * close transition finishes.
 *
 * ```tsx
 * <Transition.Presence open={open} onRequestClose={() => setOpen(false)} options={sheet}>
 *   <Sheet />
 * </Transition.Presence>
 * ```
 */
export function Presence({
	open,
	onRequestClose,
	options,
	children,
}: PresenceProps) {
	const [mounted, setMounted] = useState(open);
	if (open && !mounted) setMounted(true);

	const openRef = useRef(open);
	openRef.current = open;

	const handleRequestClose = useStableCallback(() => onRequestClose?.());
	const handleOpen = useStableCallback(() => options?.onOpen?.());
	const handleClose = useStableCallback(() => {
		options?.onClose?.();
		// Reopened while closing: stay mounted.
		if (!openRef.current) setMounted(false);
	});

	const motion = useMotion({
		...options,
		initial: "closed",
		onRequestClose: handleRequestClose,
		onOpen: handleOpen,
		onClose: handleClose,
	});

	useLayoutEffect(() => {
		if (!mounted) return;
		if (open) motion.open();
		else motion.close();
	}, [open, mounted, motion]);

	return mounted ? <MotionView value={motion}>{children}</MotionView> : null;
}
