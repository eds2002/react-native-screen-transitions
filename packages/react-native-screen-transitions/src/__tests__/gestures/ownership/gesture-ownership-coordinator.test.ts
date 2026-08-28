import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import { createGestureOwnershipCoordinator } from "../../../providers/screen/gestures/ownership/gesture-ownership-coordinator";
import type {
	GestureOwnerMap,
	ScreenGestureSource,
} from "../../../providers/screen/gestures/types";
import { createScreenTopology } from "../../../providers/screen/topology/helpers/create-screen-topology";
import type { ClaimedDirections } from "../../../types/ownership.types";

const noClaims = (): ClaimedDirections => ({
	vertical: false,
	"vertical-inverted": false,
	horizontal: false,
	"horizontal-inverted": false,
});

const owners = (): SharedValue<GestureOwnerMap> => {
	let value: GestureOwnerMap = {
		vertical: null,
		"vertical-inverted": null,
		horizontal: null,
		"horizontal-inverted": null,
	};

	return {
		get: () => value,
		set: (next) => {
			value = typeof next === "function" ? next(value) : next;
		},
	} as SharedValue<GestureOwnerMap>;
};

const source = (routeKey: string) =>
	({
		routeKey,
		panGesture: { routeKey, kind: "pan" },
		pinchGesture: { routeKey, kind: "pinch" },
		scrollState: { routeKey, kind: "scroll" },
	}) as unknown as ScreenGestureSource;

const register = (
	coordinator: ReturnType<typeof createGestureOwnershipCoordinator>,
	screenKey: string,
	claimedDirections: ClaimedDirections,
	effectiveClaimedDirections = claimedDirections,
) => {
	const ownerValue = owners();
	coordinator.register({
		screenKey,
		source: source(screenKey),
		claimedDirections,
		effectiveClaimedDirections,
		owners: ownerValue,
	});
	return ownerValue;
};

describe("gesture ownership coordinator", () => {
	it("inherits the nearest ancestor owner without linking gesture providers", () => {
		const topology = createScreenTopology();
		const coordinator = createGestureOwnershipCoordinator(topology);
		topology.register({ screenKey: "root" });
		topology.register({ screenKey: "child", parentScreenKey: "root" });
		topology.activate({ parentScreenKey: "root", screenKey: "child" });

		const rootOwners = register(coordinator, "root", {
			...noClaims(),
			vertical: true,
		});
		const childOwners = register(coordinator, "child", noClaims());

		expect(rootOwners.get().vertical).toBe("root");
		expect(childOwners.get().vertical).toBe("root");
	});

	it("gives a shared direction to the deepest active claimant", () => {
		const topology = createScreenTopology();
		const coordinator = createGestureOwnershipCoordinator(topology);
		for (const [screenKey, parentScreenKey] of [
			["root", undefined],
			["child", "root"],
			["grandchild", "child"],
		] as const) {
			topology.register({ screenKey, parentScreenKey });
		}
		topology.activate({ parentScreenKey: "root", screenKey: "child" });
		topology.activate({ parentScreenKey: "child", screenKey: "grandchild" });

		const claim = { ...noClaims(), horizontal: true };
		const rootOwners = register(coordinator, "root", claim);
		const childOwners = register(coordinator, "child", claim);
		const grandchildOwners = register(coordinator, "grandchild", claim);

		expect(rootOwners.get().horizontal).toBe("grandchild");
		expect(childOwners.get().horizontal).toBe("grandchild");
		expect(grandchildOwners.get().horizontal).toBe("grandchild");
	});

	it("resolves ownership independently per direction", () => {
		const topology = createScreenTopology();
		const coordinator = createGestureOwnershipCoordinator(topology);
		topology.register({ screenKey: "root" });
		topology.register({ screenKey: "child", parentScreenKey: "root" });
		topology.activate({ parentScreenKey: "root", screenKey: "child" });

		const rootOwners = register(coordinator, "root", {
			...noClaims(),
			vertical: true,
		});
		register(coordinator, "child", {
			...noClaims(),
			horizontal: true,
		});

		expect(rootOwners.get()).toEqual({
			vertical: "root",
			"vertical-inverted": null,
			horizontal: "child",
			"horizontal-inverted": null,
		});
	});

	it("uses a closing child's visible-route claims to block its ancestor", () => {
		const topology = createScreenTopology();
		const coordinator = createGestureOwnershipCoordinator(topology);
		topology.register({ screenKey: "root" });
		topology.register({ screenKey: "closing", parentScreenKey: "root" });
		topology.activate({ parentScreenKey: "root", screenKey: "closing" });

		const rootOwners = register(coordinator, "root", {
			...noClaims(),
			vertical: true,
		});
		register(
			coordinator,
			"closing",
			{ ...noClaims(), horizontal: true },
			{ ...noClaims(), vertical: true },
		);

		expect(rootOwners.get().vertical).toBe("closing");
		expect(rootOwners.get().horizontal).toBeNull();
	});

	it("ignores mounted siblings outside the active topology path", () => {
		const topology = createScreenTopology();
		const coordinator = createGestureOwnershipCoordinator(topology);
		topology.register({ screenKey: "root" });
		topology.register({ screenKey: "active", parentScreenKey: "root" });
		topology.register({ screenKey: "inactive", parentScreenKey: "root" });
		topology.activate({ parentScreenKey: "root", screenKey: "active" });

		const rootOwners = register(coordinator, "root", {
			...noClaims(),
			vertical: true,
		});
		register(coordinator, "active", noClaims());
		register(coordinator, "inactive", {
			...noClaims(),
			vertical: true,
		});

		expect(rootOwners.get().vertical).toBe("root");
	});

	it("restores the ancestor owner when the active child unregisters", () => {
		const topology = createScreenTopology();
		const coordinator = createGestureOwnershipCoordinator(topology);
		topology.register({ screenKey: "root" });
		topology.register({ screenKey: "child", parentScreenKey: "root" });
		topology.activate({ parentScreenKey: "root", screenKey: "child" });

		const rootOwners = register(coordinator, "root", {
			...noClaims(),
			horizontal: true,
		});
		register(coordinator, "child", {
			...noClaims(),
			horizontal: true,
		});
		expect(rootOwners.get().horizontal).toBe("child");

		coordinator.unregister("child");
		topology.unregister("child");
		expect(rootOwners.get().horizontal).toBe("root");
	});

	it("keeps a detached owner value stable during registration refresh", () => {
		const topology = createScreenTopology();
		const coordinator = createGestureOwnershipCoordinator(topology);
		topology.register({ screenKey: "root" });

		const rootOwners = register(coordinator, "root", {
			...noClaims(),
			vertical: true,
		});
		expect(rootOwners.get().vertical).toBe("root");

		coordinator.unregister("root");

		expect(rootOwners.get().vertical).toBe("root");
	});

	it("replaces a registration without dropping its ownership", () => {
		const topology = createScreenTopology();
		const coordinator = createGestureOwnershipCoordinator(topology);
		topology.register({ screenKey: "root" });
		const rootOwners = register(coordinator, "root", {
			...noClaims(),
			vertical: true,
		});

		coordinator.register({
			screenKey: "root",
			source: source("root"),
			claimedDirections: {
				...noClaims(),
				horizontal: true,
			},
			effectiveClaimedDirections: {
				...noClaims(),
				horizontal: true,
			},
			owners: rootOwners,
		});

		expect(rootOwners.get()).toEqual({
			vertical: null,
			"vertical-inverted": null,
			horizontal: "root",
			"horizontal-inverted": null,
		});
	});

	it("precomputes scroll owners and ancestor pinch coordination", () => {
		const topology = createScreenTopology();
		const coordinator = createGestureOwnershipCoordinator(topology);
		topology.register({ screenKey: "root" });
		topology.register({ screenKey: "child", parentScreenKey: "root" });
		topology.activate({ parentScreenKey: "root", screenKey: "child" });

		register(coordinator, "root", {
			...noClaims(),
			vertical: true,
		});
		register(coordinator, "child", {
			...noClaims(),
			"vertical-inverted": true,
		});

		const coordination = coordinator.getScrollCoordination("child", "vertical");
		expect(coordination.ownerRouteKeys).toEqual(["root", "child"]);
		expect(coordination.panGestures).toHaveLength(2);
		expect(coordination.scrollStates).toHaveLength(2);
		expect(coordination.pinchGestures).toHaveLength(2);
	});
});
