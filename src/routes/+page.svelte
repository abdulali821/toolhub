<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Container, SeoHead, JsonLd } from '$ui';
	import ToolCard from '$ui/catalog/ToolCard.svelte';
	import CategoryBadge from '$ui/catalog/CategoryBadge.svelte';
	import { openCommandPalette } from '$ui/navigation/command-palette-state';
	import { site } from '$lib/config/site';
	import type { CategoryIconKind } from '$ui/catalog/category-meta';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const trust = [
		'Runs in your browser',
		'No sign-up required',
		'Private by default',
		'Free forever'
	] as const;

	const packIcons: Record<string, CategoryIconKind> = {
		'json-data-pack': 'braces',
		'text-cleanup-pack': 'type',
		'developer-starter-pack': 'code',
		'image-essentials': 'image',
		'pdf-toolkit': 'pdf',
		'encoding-pack': 'encode',
		'color-design-pack': 'palette',
		'generators-pack': 'spark'
	};
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<JsonLd data={data.jsonLd} />

<main id="main">
	<section class="relative isolate overflow-hidden border-b border-border">
		<div
			class="animate-fade pointer-events-none absolute inset-0"
			style="background:
				radial-gradient(ellipse 90% 70% at 50% -10%, color-mix(in oklab, var(--color-accent) 22%, transparent), transparent 58%),
				radial-gradient(ellipse 50% 45% at 100% 30%, color-mix(in oklab, var(--color-info) 14%, transparent), transparent 55%),
				radial-gradient(ellipse 40% 40% at 0% 80%, color-mix(in oklab, var(--color-accent) 10%, transparent), transparent 50%),
				linear-gradient(180deg, color-mix(in oklab, var(--color-bg-elevated) 70%, transparent), var(--color-bg));"
			aria-hidden="true"
		></div>
		<div
			class="pointer-events-none absolute inset-0 [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%270_0_256_256%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter_id=%27n%27%3E%3CfeTurbulence_type=%27fractalNoise%27_baseFrequency=%270.85%27_numOctaves=%274%27_stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect_width=%27100%25%27_height=%27100%25%27_filter=%27url(%23n)%27/%3E%3C/svg%3E')] opacity-[0.04]"
			aria-hidden="true"
		></div>

		<Container class="relative flex flex-col justify-center py-14 sm:py-16 md:py-20">
			<p class="animate-rise text-sm font-semibold tracking-[0.12em] text-accent uppercase">
				{site.name}
			</p>
			<h1
				class="animate-rise-delay-1 mt-3 max-w-3xl font-display text-4xl font-semibold tracking-tight text-balance text-fg sm:text-5xl md:text-6xl"
			>
				{site.tagline}
			</h1>
			<p class="animate-rise-delay-2 mt-4 max-w-xl text-lg text-pretty text-muted">
				Format, convert, and generate without uploading your work. Open a tool, finish the task,
				move on.
			</p>

			<div class="animate-rise-delay-2 mt-8 max-w-xl">
				<button
					type="button"
					class="pressable group flex w-full items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3.5 text-left shadow-sm transition-[border-color,box-shadow] hover:border-accent/40 hover:shadow-md"
					onclick={() => openCommandPalette()}
					aria-keyshortcuts="Control+K Meta+K"
				>
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						aria-hidden="true"
						class="shrink-0 text-muted transition-colors group-hover:text-accent"
					>
						<path
							d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16.5 16.5L21 21"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					<span class="min-w-0 flex-1 text-sm text-muted sm:text-base"
						>Search tools, packs, categories…</span
					>
					<kbd
						class="hidden rounded-md border border-border bg-bg px-2 py-1 font-mono text-[11px] text-muted sm:inline"
						>Ctrl K</kbd
					>
				</button>
				<div class="mt-4 flex flex-wrap items-center gap-3">
					<Button href="/search" size="lg">Search tools</Button>
					<Button href="/tools" variant="secondary" size="lg">Browse catalog</Button>
				</div>
			</div>

			<ul class="animate-rise-delay-2 mt-8 flex flex-wrap gap-2" aria-label="Why ToolHub">
				{#each trust as item (item)}
					<li
						class="rounded-full border border-border/80 bg-bg-elevated/80 px-3 py-1 text-xs font-medium text-muted sm:text-sm"
					>
						{item}
					</li>
				{/each}
			</ul>
		</Container>
	</section>

	<Container as="section" class="py-12 sm:py-16" aria-labelledby="featured-heading">
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<h2
					id="featured-heading"
					class="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
				>
					Popular tools
				</h2>
				<p class="mt-2 text-muted">Start with the tools people open every day.</p>
			</div>
			<a
				href={resolve('/tools')}
				class="text-sm font-medium text-accent transition-colors hover:text-accent-hover hover:underline"
				>View all tools</a
			>
		</div>

		<ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.featured as tool (tool.id)}
				<li>
					<ToolCard
						id={tool.id}
						name={tool.name}
						description={tool.description}
						category={tool.category}
					/>
				</li>
			{/each}
		</ul>
	</Container>

	<section class="border-y border-border bg-bg-elevated/50">
		<Container class="py-12 sm:py-16" aria-labelledby="packs-heading">
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2
						id="packs-heading"
						class="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
					>
						Tool packs
					</h2>
					<p class="mt-2 max-w-xl text-muted">
						Curated workflows for common jobs—no account required.
					</p>
				</div>
			</div>

			<ul class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.collections as pack (pack.id)}
					<li
						id="pack-{pack.id}"
						class="surface-card flex scroll-mt-24 flex-col p-5 transition-[border-color,box-shadow,transform] duration-[var(--duration-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
					>
						<div class="flex items-start gap-3">
							<CategoryBadge kind={packIcons[pack.id] ?? 'spark'} size="md" />
							<div class="min-w-0">
								<h3 class="font-display text-lg font-semibold tracking-tight">{pack.name}</h3>
								<p class="mt-1.5 text-sm text-pretty text-muted">{pack.description}</p>
							</div>
						</div>
						<ul class="mt-5 space-y-1.5 border-t border-border/80 pt-4">
							{#each pack.tools.slice(0, 5) as tool (tool.id)}
								<li>
									<a
										href={resolve(`/tools/${tool.id}`)}
										class="group/link inline-flex items-center gap-1.5 text-sm font-medium text-fg no-underline transition-colors hover:text-accent"
									>
										<span
											class="text-muted transition-colors group-hover/link:text-accent"
											aria-hidden="true">→</span
										>
										{tool.name}
									</a>
								</li>
							{/each}
							{#if pack.tools.length > 5}
								<li class="pt-1 text-xs text-muted">
									+{pack.tools.length - 5} more in this pack
								</li>
							{/if}
						</ul>
						<a
							href={resolve(`/tools/${pack.tools[0]?.id}`)}
							class="mt-5 inline-flex text-sm font-semibold text-accent no-underline transition-colors hover:text-accent-hover"
						>
							Start with {pack.tools[0]?.name ?? 'first tool'} →
						</a>
					</li>
				{/each}
			</ul>
		</Container>
	</section>

	<Container as="section" class="py-12 sm:py-16" aria-labelledby="why-heading">
		<h2 id="why-heading" class="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
			Why people stay
		</h2>
		<ul class="mt-8 grid gap-6 sm:grid-cols-3">
			<li class="rounded-lg border border-border/70 bg-bg-elevated/40 p-5">
				<p class="font-display text-lg font-semibold">Private by default</p>
				<p class="mt-2 text-sm text-pretty text-muted">
					Most tools run entirely in your browser. Your text and files stay on your device.
				</p>
			</li>
			<li class="rounded-lg border border-border/70 bg-bg-elevated/40 p-5">
				<p class="font-display text-lg font-semibold">Shareable settings</p>
				<p class="mt-2 text-sm text-pretty text-muted">
					Many text and data tools let you copy a link with your options. File tools stay local—no
					URL payloads.
				</p>
			</li>
			<li class="rounded-lg border border-border/70 bg-bg-elevated/40 p-5">
				<p class="font-display text-lg font-semibold">Always free</p>
				<p class="mt-2 text-sm text-pretty text-muted">
					No subscriptions. No API keys. Open a tool and finish the task.
				</p>
			</li>
		</ul>
	</Container>
</main>
