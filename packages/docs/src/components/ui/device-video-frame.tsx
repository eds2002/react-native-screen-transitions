export function DeviceVideoFrame({
	device = "ios",
	src,
	title,
}: {
	device?: "android" | "ios";
	src: string;
	title: string;
}) {
	const outerRadius =
		device === "android" ? "rounded-[36px]" : "rounded-[60px]";
	const innerRadius =
		device === "android" ? "rounded-[28px]" : "rounded-[48px]";
	const frameWidth =
		device === "android"
			? "w-[98%] max-w-[21.8rem]"
			: "w-full max-w-[22.25rem]";

	return (
		<div className="flex w-full min-w-0 justify-center">
			<div
				className={`flex ${frameWidth} min-w-0 ${outerRadius} bg-neutral-200 p-2 dark:bg-neutral-800 sm:p-3`}
			>
				<div className={`w-full min-w-0 overflow-hidden ${innerRadius}`}>
					<video
						src={src}
						title={title}
						autoPlay
						muted
						playsInline
						loop
						preload="metadata"
						className="block h-auto w-full scale-[1.01] bg-transparent"
					/>
				</div>
			</div>
		</div>
	);
}
