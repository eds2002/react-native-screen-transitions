import type { ReactNode } from "react";

import { DocHeading } from "../docs/doc-heading";

export type StepInjectedProps = {
	isLast?: boolean;
	stepNumber?: number;
};

export type StepProps = {
	children?: ReactNode;
	description?: ReactNode;
	title: ReactNode;
} & StepInjectedProps;

export function Step({
	children,
	description,
	isLast = false,
	stepNumber,
	title,
}: StepProps) {
	return (
		<li className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4  sm:gap-x-6">
			<div className="relative flex justify-center">
				<span className="z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 font-medium tabular-nums text-neutral-950 dark:bg-neutral-900 dark:text-neutral-50">
					{stepNumber}
				</span>
				{isLast ? null : (
					<span className="absolute bottom-0 left-1/2 top-0 w-[2.5px] -translate-x-1/2 bg-neutral-100 dark:bg-neutral-900" />
				)}
			</div>
			<div className={isLast ? "pb-0" : "pb-12 sm:pb-14"}>
				<DocHeading
					as="h3"
					className="text-xl font-medium text-neutral-950 dark:text-neutral-50"
				>
					{title}
				</DocHeading>
				{description ? (
					<p className="max-w-full text-neutral-600 dark:text-neutral-400 pt-2">
						{description}
					</p>
				) : null}
				{children ? (
					<div className="mt-6 min-w-0 [&>*+*]:mt-5 [&>blockquote]:max-w-[46rem] [&>ol]:max-w-[46rem] [&>ol]:list-decimal [&>ol]:pl-[1.4rem] [&>ol]:text-[1.05rem] [&>ol]:leading-[1.8] [&>ol]:text-[#5c6d66] [&>p]:max-w-[46rem] [&>p]:text-[1.05rem] [&>p]:leading-[1.8] [&>p]:text-[#5c6d66] [&>ul]:max-w-[46rem] [&>ul]:list-disc [&>ul]:pl-[1.4rem] [&>ul]:text-[1.05rem] [&>ul]:leading-[1.8] [&>ul]:text-[#5c6d66] dark:[&>ol]:text-[#95a49f] dark:[&>p]:text-[#95a49f] dark:[&>ul]:text-[#95a49f]">
						{children}
					</div>
				) : null}
			</div>
		</li>
	);
}
