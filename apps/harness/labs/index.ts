import { lab as backdrop } from "./backdrop";
import { lab as bounds } from "./bounds";
import { lab as chain } from "./chain";
import { lab as follow } from "./follow";
import { lab as gestures } from "./gestures";
import { lab as global } from "./global";
import { lab as handoff } from "./handoff";
import { lab as heavy } from "./heavy";
import { lab as inactive } from "./inactive";
import { lab as manybounds } from "./manybounds";
import { lab as motion } from "./motion";
import { lab as nativeStack } from "./native-stack";
import { lab as overlay } from "./overlay";
import { lab as ownership } from "./ownership";
import { lab as perf } from "./perf";
import { lab as realms } from "./realms";
import { lab as screencycles } from "./screencycles";
import { lab as scroll } from "./scroll";
import { lab as scrollbounds } from "./scrollbounds";
import { lab as sheet } from "./sheet";
import { lab as slots } from "./slots";
import { lab as stack } from "./stack";
import type { Lab } from "./ui";

/** One lab per library mechanism, in this order on the home screen. */
export const LABS: Lab[] = [
	stack,
	heavy,
	sheet,
	backdrop,
	gestures,
	ownership,
	scroll,
	inactive,
	slots,
	overlay,
	bounds,
	follow,
	chain,
	global,
	handoff,
	realms,
	scrollbounds,
	nativeStack,
	motion,
	perf,
	manybounds,
	screencycles,
];
