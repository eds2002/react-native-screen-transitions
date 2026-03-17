import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";

import styles from "./index.module.css";

const releaseTracks = [
	{
		eyebrow: "stable line",
		title: "3.x docs stay boring on purpose",
		body: "Freeze the docs when a release line is worth preserving. Patch and minor work keeps landing inside the stable line instead of spawning version clutter.",
		href: "/docs/intro",
		label: "Browse 3.x",
	},
	{
		eyebrow: "next train",
		title: "Current prerelease work lives in Next",
		body: "Alpha, beta, and rc work share a single unreleased lane so the docs can move with the code without snapshotting every prerelease tag.",
		href: "/docs/next/release-notes/3-4-next",
		label: "Track Next",
	},
	{
		eyebrow: "api source",
		title: "Reference pages are generated from public entrypoints",
		body: "Only the exported package surface is documented. Internal modules stay out of the site, and API markdown can be regenerated from TypeScript on demand.",
		href: "/docs/api",
		label: "Inspect API",
	},
];

const managementLanes = [
	{
		title: "Guides",
		copy: "Human-written docs own installation, mental models, recipes, migration notes, and release summaries.",
	},
	{
		title: "Examples",
		copy: "The Expo app in apps/e2e is the demo source for patterns, screenshots, and real transition scenarios.",
	},
	{
		title: "Versions",
		copy: "The site exposes one stable line and one Next line, which keeps maintenance low while preserving release accuracy.",
	},
];

const commandFlow = [
	"bun run docs:api",
	"bun run docs:version 3.x",
	"bun run docs:build",
];

export default function Home(): ReactNode {
	const { siteConfig } = useDocusaurusContext();

	return (
		<Layout
			title={siteConfig.title}
			description="Versioned docs for react-native-screen-transitions.">
			<main className={styles.page}>
				<section className={styles.hero}>
					<div className={styles.heroGlow} />
					<div className={styles.heroContent}>
						<p className={styles.kicker}>Release-aware documentation pipeline</p>
						<h1 className={styles.title}>
							Ship the package.
							<br />
							Keep the docs in rhythm.
						</h1>
						<p className={styles.lead}>{siteConfig.tagline}</p>
						<div className={styles.actions}>
							<Link className="button button--primary button--lg" to="/docs/intro">
								Start with the docs
							</Link>
							<Link className={styles.ghostButton} to="/docs/next/intro">
								See the Next release lane
							</Link>
						</div>
					</div>
					<div className={styles.heroPanel}>
						<div className={styles.signalRow}>
							<span>public entrypoints</span>
							<strong>4</strong>
						</div>
						<div className={styles.signalRow}>
							<span>stable docs lane</span>
							<strong>3.x</strong>
						</div>
						<div className={styles.signalRow}>
							<span>unreleased docs lane</span>
							<strong>Next</strong>
						</div>
						<div className={styles.commandCard}>
							<p className={styles.commandLabel}>core flow</p>
							{commandFlow.map((command) => (
								<code key={command}>{command}</code>
							))}
						</div>
					</div>
				</section>

				<section className={styles.trackGrid}>
					{releaseTracks.map((track) => (
						<article key={track.title} className={styles.trackCard}>
							<p className={styles.cardEyebrow}>{track.eyebrow}</p>
							<h2>{track.title}</h2>
							<p>{track.body}</p>
							<Link className={styles.inlineLink} to={track.href}>
								{track.label}
							</Link>
						</article>
					))}
				</section>

				<section className={styles.managementSection}>
					<div className={styles.sectionHeading}>
						<p className={styles.kicker}>Content system</p>
						<h2>One docs site, three maintenance lanes</h2>
					</div>
					<div className={styles.laneGrid}>
						{managementLanes.map((lane) => (
							<article key={lane.title} className={styles.laneCard}>
								<h3>{lane.title}</h3>
								<p>{lane.copy}</p>
							</article>
						))}
					</div>
				</section>
			</main>
		</Layout>
	);
}
