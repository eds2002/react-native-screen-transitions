import { create } from "zustand";

interface ActivityProbeState {
	heartbeatCount: number;
	pressCount: number;
	lastHeartbeatAt: number | null;
	recordHeartbeat: () => void;
	recordPress: () => void;
	reset: () => void;
}

const INITIAL_STATE = {
	heartbeatCount: 0,
	pressCount: 0,
	lastHeartbeatAt: null,
} as const;

export const useActivityProbeStore = create<ActivityProbeState>((set) => ({
	...INITIAL_STATE,
	recordHeartbeat: () =>
		set((state) => ({
			heartbeatCount: state.heartbeatCount + 1,
			lastHeartbeatAt: performance.now(),
		})),
	recordPress: () =>
		set((state) => ({
			pressCount: state.pressCount + 1,
		})),
	reset: () => set(INITIAL_STATE),
}));
