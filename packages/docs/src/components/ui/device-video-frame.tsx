export function DeviceVideoFrame({
	src,
	title,
}: {
	src: string;
	title: string;
}) {
	return (
		<div className="flex w-full justify-center">
			<div className="inline-flex rounded-[60px] bg-neutral-200 p-3 dark:bg-neutral-800">
				<div className="max-h-[720px] max-w-full overflow-hidden rounded-[48px]">
					<video
						src={src}
						title={title}
						autoPlay
						muted
						playsInline
						loop
						preload="metadata"
						className="block max-h-[720px] max-w-full scale-[1.01] bg-transparent"
					/>
				</div>
			</div>
		</div>
	);
}
