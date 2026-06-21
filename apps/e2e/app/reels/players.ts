import { createVideoPlayer, type VideoPlayer } from "expo-video";
import type { Reel } from "./constants";

/**
 * One shared player per reel. The feed card's VideoView and the player
 * page's VideoView render the SAME player instance — one stream, one decode,
 * two surfaces — so the teleport crossfade is pixel-identical and playback
 * position carries everywhere by construction.
 *
 * Demo-scope registry: players live for the app session. A production app
 * would release them when their reel leaves all viewports.
 */
const players = new Map<string, VideoPlayer>();

export const getReelPlayer = (reel: Reel): VideoPlayer => {
	let player = players.get(reel.id);

	if (!player) {
		player = createVideoPlayer(reel.source);
		player.loop = true;
		player.muted = true;
		player.play();
		players.set(reel.id, player);
	}

	return player;
};
