function getYoutubeVideoId(src: string) {
	const embedMatch = /youtube\.com\/embed\/([^?&/]+)/.exec(src);
	if (embedMatch?.[1]) {
		return embedMatch[1];
	}

	const watchMatch = /[?&]v=([^?&/]+)/.exec(src);
	return watchMatch?.[1];
}

export function VideoEmbed({ src, title }: { src: string; title: string }) {
	const videoId = getYoutubeVideoId(src);
	const href = videoId ? `https://www.youtube.com/watch?v=${videoId}` : src;
	const thumbnail = videoId
		? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
		: undefined;

	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer"
			className="group block max-w-[46rem] overflow-hidden rounded-3xl bg-neutral-100 transition-transform duration-150 hover:-translate-y-0.5 dark:bg-neutral-900"
		>
			<div className="relative aspect-video w-full overflow-hidden">
				{thumbnail ? (
					<img
						src={thumbnail}
						alt={title}
						loading="lazy"
						className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-neutral-200 dark:bg-neutral-800">
						<span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
							Open video
						</span>
					</div>
				)}

				<div className="absolute inset-0 bg-black/10 transition-colors duration-150 group-hover:bg-black/5" />

				<div className="absolute inset-x-4 bottom-4 flex items-center gap-3">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-neutral-950 shadow-lg">
						<div className="ml-1 h-0 w-0 border-y-[8px] border-y-transparent border-l-[12px] border-l-current" />
					</div>
					<div className="rounded-full bg-black/70 px-3 py-1.5 text-sm font-medium text-white">
						{title}
					</div>
				</div>
			</div>
		</a>
	);
}
