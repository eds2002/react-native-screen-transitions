import { createVideoPlayer } from "expo-video";

const source = require("../../assets/videos/subway.mp4");

export const debugVideoPlayer = createVideoPlayer(source);

debugVideoPlayer.loop = true;
debugVideoPlayer.muted = true;
debugVideoPlayer.play();
