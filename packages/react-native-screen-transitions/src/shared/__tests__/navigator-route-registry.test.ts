import { beforeEach, describe, expect, it } from "bun:test";
import {
	_resetNavigatorRouteRegistry,
	registerMountedRoute,
	unregisterMountedRoute,
} from "../components/screen-lifecycle/hooks/use-close-transition/helpers/navigator-route-registry";

beforeEach(() => {
	_resetNavigatorRouteRegistry();
});

describe("navigator route registry", () => {
	it("returns true only when the last route is unregistered", () => {
		registerMountedRoute("nav-main", "a");
		registerMountedRoute("nav-main", "b");

		expect(unregisterMountedRoute("nav-main", "a")).toBe(false);
		expect(unregisterMountedRoute("nav-main", "b")).toBe(true);
	});

	it("is idempotent for duplicate route registration", () => {
		registerMountedRoute("nav-main", "a");
		registerMountedRoute("nav-main", "a");

		expect(unregisterMountedRoute("nav-main", "a")).toBe(true);
		expect(unregisterMountedRoute("nav-main", "a")).toBe(false);
	});

	it("isolates route counts per navigator", () => {
		registerMountedRoute("nav-main", "a");
		registerMountedRoute("nav-modal", "a");
		registerMountedRoute("nav-modal", "b");

		expect(unregisterMountedRoute("nav-main", "a")).toBe(true);
		expect(unregisterMountedRoute("nav-modal", "a")).toBe(false);
		expect(unregisterMountedRoute("nav-modal", "b")).toBe(true);
	});
});
