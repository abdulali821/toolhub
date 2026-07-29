<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { Container, SeoHead } from '$ui';
	import { site } from '$lib/config/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const sections = [
		{ id: 'philosophy', label: 'Our Philosophy' },
		{ id: 'local-first', label: 'Local-First Architecture' },
		{ id: 'data-collection', label: 'Data Collection' },
		{ id: 'fast-free', label: 'Fast & Free Promise' },
		{ id: 'security', label: 'Security Measures' },
		{ id: 'contact', label: 'Get in touch' }
	] as const;

	let activeId = $state<string>(sections[0].id);

	onMount(() => {
		const nodes = sections
			.map((s) => document.getElementById(s.id))
			.filter((el): el is HTMLElement => el != null);

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
				if (visible[0]?.target.id) activeId = visible[0].target.id;
			},
			{ rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
		);

		for (const node of nodes) observer.observe(node);
		return () => observer.disconnect();
	});
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<main id="main" class="flex-1 bg-bg pt-28 pb-20">
	<Container>
		<div class="flex flex-col items-start gap-10 lg:flex-row">
			<aside class="w-full shrink-0 lg:sticky lg:top-28 lg:w-64">
				<div class="rounded-xl border border-border bg-bg-elevated p-6 shadow-sm">
					<h2
						class="mb-4 border-b border-border pb-3 text-xs font-semibold tracking-wider text-fg uppercase"
					>
						Contents
					</h2>
					<nav aria-label="Privacy sections" class="space-y-3 text-sm">
						{#each sections as section (section.id)}
							<a
								href={`#${section.id}`}
								class="block no-underline transition-colors {activeId === section.id
									? 'font-medium text-fg'
									: 'text-muted hover:text-fg'}"
								aria-current={activeId === section.id ? 'true' : undefined}
							>
								{section.label}
							</a>
						{/each}
					</nav>
				</div>
			</aside>

			<article class="w-full max-w-4xl flex-1">
				<div class="rounded-2xl border border-border bg-bg-elevated p-8 shadow-sm md:p-12">
					<header class="mb-12 border-b border-border pb-8">
						<div
							class="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-bg text-fg"
							aria-hidden="true"
						>
							<svg width="22" height="22" viewBox="0 0 24 24" fill="none">
								<path
									d="M12 3l8 3.5v5.2c0 4.6-3.1 8.8-8 9.8-4.9-1-8-5.2-8-9.8V6.5L12 3z"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linejoin="round"
								/>
								<path
									d="M9.5 12.2l1.8 1.8 3.4-3.6"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</div>
						<h1 class="mb-4 font-display text-3xl font-semibold tracking-tight text-fg md:text-4xl">
							Trust & Privacy
						</h1>
						<p class="text-sm text-muted">Last updated: July 23, 2026</p>
					</header>

					<div class="space-y-12">
						<section id="philosophy" class="scroll-mt-28">
							<h2 class="mb-4 font-display text-2xl font-semibold text-fg">Our Philosophy</h2>
							<p class="mb-4 text-base leading-relaxed text-muted">
								At {site.name}, we believe that world-class professional tools shouldn't come at the
								cost of your privacy. Our platform is built on a fundamental principle: your data
								belongs to you. We have engineered our suite of browser tools to operate in a calm,
								secure, and privacy-respecting manner, so professionals, students, and creators can
								work without surveillance.
							</p>
							<p class="text-base leading-relaxed text-muted">
								This document outlines our commitments to keeping your workflow private, fast, and
								entirely within your control.
							</p>
						</section>

						<section id="local-first" class="scroll-mt-28">
							<h2 class="mb-4 font-display text-2xl font-semibold text-fg">
								Local-First Architecture
							</h2>
							<p class="mb-4 text-base leading-relaxed text-muted">
								Most tools on {site.name} execute strictly within your local browser environment. That
								means:
							</p>
							<ul class="space-y-3 pl-2 text-base leading-relaxed text-muted">
								<li class="flex items-start gap-3">
									<svg
										class="mt-1 shrink-0 text-muted"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										aria-hidden="true"
									>
										<path
											d="M5 13l4 4L19 7"
											stroke="currentColor"
											stroke-width="2.25"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									<span
										><strong class="font-semibold text-fg">Zero Server Uploads:</strong> Text formatting,
										data conversions, and calculations happen on your machine. We do not transmit your
										tool input to our servers.</span
									>
								</li>
								<li class="flex items-start gap-3">
									<svg
										class="mt-1 shrink-0 text-muted"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										aria-hidden="true"
									>
										<path
											d="M5 13l4 4L19 7"
											stroke="currentColor"
											stroke-width="2.25"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									<span
										><strong class="font-semibold text-fg">Offline Capability:</strong> Many utilities
										continue to work even if you lose your internet connection.</span
									>
								</li>
								<li class="flex items-start gap-3">
									<svg
										class="mt-1 shrink-0 text-muted"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										aria-hidden="true"
									>
										<path
											d="M5 13l4 4L19 7"
											stroke="currentColor"
											stroke-width="2.25"
											stroke-linecap="round"
											stroke-linejoin="round"
										/>
									</svg>
									<span
										><strong class="font-semibold text-fg">Instant Processing:</strong> Because data doesn't
										travel over the network, results are generated with near-zero latency.</span
									>
								</li>
							</ul>
						</section>

						<section id="data-collection" class="scroll-mt-28">
							<h2 class="mb-4 font-display text-2xl font-semibold text-fg">Data Collection</h2>
							<p class="mb-4 text-base leading-relaxed text-muted">
								We practice data minimization. We only collect the bare minimum required to keep the
								platform operational and to understand broad usage trends so we can improve our
								offerings.
							</p>
							<div class="mt-6 rounded-xl border border-border bg-bg p-6">
								<h3 class="mb-2 text-sm font-semibold tracking-wider text-fg uppercase">
									What we collect
								</h3>
								<p class="mb-4 text-sm text-muted">
									Basic anonymous analytics (page views, tool popularity) and optional account
									information (email address) if you choose to sign in for favorites or history.
								</p>
								<h3 class="mb-2 text-sm font-semibold tracking-wider text-fg uppercase">
									What we NEVER collect
								</h3>
								<p class="text-sm text-muted">
									The contents of your text, code snippets, converted files, keystrokes, or any
									sensitive professional data processed through our local tools.
								</p>
							</div>
						</section>

						<section id="fast-free" class="scroll-mt-28">
							<h2 class="mb-4 font-display text-2xl font-semibold text-fg">
								The Fast & Free Promise
							</h2>
							<p class="mb-4 text-base leading-relaxed text-muted">
								By leveraging modern browsers to handle processing locally, we reduce the need for
								expensive server infrastructure. That architectural choice lets us keep our core
								suite of professional tools free for everyone.
							</p>
							<p class="text-base leading-relaxed text-muted">
								No paywalls for basic features, no intrusive ads disrupting your focus, and no
								artificial delays—just clean software that gets out of your way.
							</p>
						</section>

						<section id="security" class="scroll-mt-28">
							<h2 class="mb-4 font-display text-2xl font-semibold text-fg">Security Measures</h2>
							<p class="text-base leading-relaxed text-muted">
								For the few services that require server interaction (signing in, saving favorites,
								or submitting a tool request), we use industry-standard encryption. Data in transit
								is protected via HTTPS/TLS, and account data is stored with encryption at rest.
							</p>
						</section>

						<section id="contact" class="scroll-mt-28 border-t border-border pt-6">
							<h2 class="mb-3 font-display text-xl font-semibold text-fg">
								Questions about privacy?
							</h2>
							<p class="mb-4 text-sm leading-relaxed text-muted">
								If you have concerns about how your data is handled, or wish to delete your account
								information, use the request form and describe what you need — we review every
								submission.
							</p>
							<a
								href={resolve('/request-tool')}
								class="inline-flex items-center gap-2 text-sm font-medium text-fg no-underline transition-colors hover:text-muted"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path
										d="M12 5v14M5 12h14"
										stroke="currentColor"
										stroke-width="1.75"
										stroke-linecap="round"
									/>
								</svg>
								Request a tool / get in touch
							</a>
						</section>
					</div>
				</div>
			</article>
		</div>
	</Container>
</main>
