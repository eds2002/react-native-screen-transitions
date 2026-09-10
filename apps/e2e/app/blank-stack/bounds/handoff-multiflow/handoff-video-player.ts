import { createVideoPlayer } from "expo-video";

const source = require("../../../../assets/videos/subway.mp4");

export const handoffVideoPlayer = createVideoPlayer(source);

handoffVideoPlayer.loop = true;
handoffVideoPlayer.muted = true;
handoffVideoPlayer.play();
