<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, SeoHead, JsonLd } from '$ui';
	import ToolCard from '$ui/catalog/ToolCard.svelte';
	import CategoryBadge from '$ui/catalog/CategoryBadge.svelte';
	import CategoryIcon from '$ui/catalog/CategoryIcon.svelte';
	import { openCommandPalette } from '$ui/navigation/command-palette-state';
	import { site } from '$lib/config/site';
	import type { CategoryIconKind } from '$ui/catalog/category-meta';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const trust = [
		{ label: 'Local & Fast', icon: 'bolt' as const },
		{ label: 'Privacy First', icon: 'shield' as const },
		{ label: 'Free Forever', icon: 'box' as const },
		{ label: 'Browser Based', icon: 'chrome' as const }
	];

	/** Mockup showcase cards → tools catalog filtered by category */
	const showcase = [
		{
			category: 'developer' as const,
			title: 'Developer',
			blurb: 'Formatters, encoders, JWT.',
			kind: 'code' as CategoryIconKind
		},
		{
			category: 'color' as const,
			title: 'Design',
			blurb: 'Colors, SVG optimizers.',
			kind: 'palette' as CategoryIconKind
		},
		{
			category: 'text' as const,
			title: 'Text & Content',
			blurb: 'Case converters, counters.',
			kind: 'type' as CategoryIconKind
		},
		{
			category: 'calculators' as const,
			title: 'Math & Data',
			blurb: 'Generators, calculators.',
			kind: 'calc' as CategoryIconKind
		}
	];

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

<main id="main" class="bg-bg-elevated pt-8 pb-20 sm:pt-10">
	<!-- Hero — matches Goforit homepage mockup -->
	<section class="relative mx-auto max-w-5xl px-4 pt-16 pb-12 text-center sm:px-6 lg:px-8">
		<div
			class="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-bg px-3 py-1 text-xs font-medium text-muted"
		>
			<span class="flex h-2 w-2 rounded-full bg-fg" aria-hidden="true"></span>
			Introducing Curated Tool Packs
		</div>

		<h1
			class="mb-6 font-display text-5xl leading-[1.1] font-medium tracking-tight text-fg md:text-7xl"
		>
			Premium tools for
			<br class="hidden md:block" />
			<span class="text-muted italic">focused</span> work.
		</h1>

		<p class="mx-auto mt-4 mb-10 max-w-2xl text-lg font-light text-muted md:text-xl">
			A carefully curated suite of browser-based utilities. Fast, privacy-first, and completely
			free. Run everything locally without leaving your tab.
		</p>

		<div class="group relative mx-auto max-w-2xl">
			<button
				type="button"
				class="relative block w-full rounded-2xl border border-border bg-bg-elevated py-4 pr-4 pl-12 text-left shadow-premium transition-shadow duration-300 group-hover:shadow-premium-hover focus:border-fg focus:ring-1 focus:ring-fg focus:outline-none sm:text-lg md:py-5"
				onclick={() => openCommandPalette()}
				aria-keyshortcuts="Control+K Meta+K"
			>
				<span
					class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-muted transition-colors group-focus-within:text-fg"
					aria-hidden="true"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
						<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.75" />
						<path
							d="M20 20l-3.5-3.5"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
						/>
					</svg>
				</span>
				<span class="block truncate text-muted"
					>Search for formatting, conversion, or generation tools...</span
				>
				<span
					class="pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-3 sm:flex"
					aria-hidden="true"
				>
					<span class="rounded border border-border bg-bg px-2 py-1 text-xs font-medium text-muted"
						>⌘K</span
					>
				</span>
			</button>
		</div>

		<ul
			class="mt-12 flex flex-wrap justify-center gap-8 text-sm font-medium text-muted md:gap-16"
			aria-label="Why {site.name}"
		>
			{#each trust as item (item.label)}
				<li class="flex items-center gap-2">
					<span class="text-muted" aria-hidden="true">
						{#if item.icon === 'bolt'}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
								><path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z" /></svg
							>
						{:else if item.icon === 'shield'}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
								><path
									d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linejoin="round"
								/><path
									d="M9 12l2 2 4-4"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linecap="round"
									stroke-linejoin="round"
								/></svg
							>
						{:else if item.icon === 'box'}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
								><path
									d="M3 8l9-4 9 4v8l-9 4-9-4V8z"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linejoin="round"
								/><path
									d="M3 8l9 4 9-4M12 12v8"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linecap="round"
								/></svg
							>
						{:else}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none"
								><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.75" /><path
									d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"
									stroke="currentColor"
									stroke-width="1.5"
								/></svg
							>
						{/if}
					</span>
					{item.label}
				</li>
			{/each}
		</ul>
	</section>

	<!-- Interface preview — decorative, non-functional -->
	<section class="mx-auto mt-12 mb-24 max-w-6xl px-4 sm:px-6 lg:px-8" aria-hidden="true">
		<div class="rounded-2xl border border-border/60 bg-bg/50 p-2 shadow-premium">
			<div class="overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-sm">
				<div class="flex h-12 items-center gap-2 border-b border-border bg-bg/80 px-4">
					<div class="flex gap-1.5">
						<div class="h-3 w-3 rounded-full bg-border"></div>
						<div class="h-3 w-3 rounded-full bg-border"></div>
						<div class="h-3 w-3 rounded-full bg-border"></div>
					</div>
					<div class="mx-auto flex items-center px-4 sm:px-32">
						<div
							class="flex h-6 w-40 items-center rounded-md border border-border bg-bg-elevated px-2 shadow-sm sm:w-64"
						>
							<svg width="10" height="10" viewBox="0 0 24 24" fill="none" class="text-muted">
								<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
								<path
									d="M20 20l-3.5-3.5"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								/>
							</svg>
						</div>
					</div>
				</div>
				<div class="flex gap-8 p-6 md:p-8">
					<div class="hidden w-48 shrink-0 flex-col gap-3 border-r border-border pr-4 md:flex">
						<div class="flex h-8 w-full items-center gap-2 rounded-md bg-bg px-3">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="text-muted"
								><path
									d="M4 6h16M4 12h16M4 18h10"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								/></svg
							>
							<div class="h-3 w-16 rounded bg-border"></div>
						</div>
						<div class="flex h-8 w-full items-center gap-2 rounded-md px-3">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="text-muted"
								><path
									d="M8 7L3 12l5 5M16 7l5 5-5 5"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linecap="round"
								/></svg
							>
							<div class="h-3 w-20 rounded bg-border"></div>
						</div>
						<div class="flex h-8 w-full items-center gap-2 rounded-md px-3">
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="text-muted"
								><rect
									x="4"
									y="5"
									width="16"
									height="14"
									rx="2"
									stroke="currentColor"
									stroke-width="1.75"
								/><circle cx="9" cy="10" r="1.5" fill="currentColor" /><path
									d="M4 16l4-3 3 2 5-5 4 4"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								/></svg
							>
							<div class="h-3 w-14 rounded bg-border"></div>
						</div>
					</div>
					<div class="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
						<div
							class="group flex h-32 flex-col gap-3 rounded-xl border border-border p-4 transition-colors"
						>
							<div
								class="flex h-8 w-8 items-center justify-center rounded-lg bg-bg text-muted transition-colors group-hover:bg-border group-hover:text-fg"
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
									><path
										d="M4 7h16M9 7V5h6v2M8 11v8M16 11v8M10 19h4"
										stroke="currentColor"
										stroke-width="1.75"
										stroke-linecap="round"
									/></svg
								>
							</div>
							<div>
								<div class="mb-2 h-4 w-24 rounded bg-fg"></div>
								<div class="h-3 w-full rounded bg-border"></div>
								<div class="mt-1 h-3 w-2/3 rounded bg-border"></div>
							</div>
						</div>
						<div
							class="group flex h-32 flex-col gap-3 rounded-xl border border-border p-4 transition-colors"
						>
							<div
								class="flex h-8 w-8 items-center justify-center rounded-lg bg-bg text-muted transition-colors group-hover:bg-border group-hover:text-fg"
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
									><path
										d="M8 7L3 12l5 5M16 7l5 5-5 5"
										stroke="currentColor"
										stroke-width="1.75"
										stroke-linecap="round"
									/></svg
								>
							</div>
							<div>
								<div class="mb-2 h-4 w-20 rounded bg-fg"></div>
								<div class="h-3 w-full rounded bg-border"></div>
								<div class="mt-1 h-3 w-1/2 rounded bg-border"></div>
							</div>
						</div>
						<div
							class="group hidden h-32 flex-col gap-3 rounded-xl border border-border p-4 transition-colors md:flex"
						>
							<div
								class="flex h-8 w-8 items-center justify-center rounded-lg bg-bg text-muted transition-colors group-hover:bg-border group-hover:text-fg"
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"
									><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.75" /><circle
										cx="12"
										cy="12"
										r="3"
										fill="currentColor"
									/></svg
								>
							</div>
							<div>
								<div class="mb-2 h-4 w-28 rounded bg-fg"></div>
								<div class="h-3 w-full rounded bg-border"></div>
								<div class="mt-1 h-3 w-3/4 rounded bg-border"></div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Categories -->
	<section
		id="categories"
		class="mx-auto mb-24 max-w-7xl px-4 sm:px-6 lg:px-8"
		aria-labelledby="categories-heading"
	>
		<div class="mb-8 flex items-end justify-between">
			<div>
				<h2 id="categories-heading" class="font-display text-3xl text-fg">Explore by Category</h2>
				<p class="mt-2 font-light text-muted">Find exactly what you need.</p>
			</div>
			<a
				href={resolve('/tools')}
				class="hidden text-sm font-medium text-fg no-underline hover:underline sm:block"
				>View all tools →</a
			>
		</div>

		<ul class="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
			{#each showcase as cat (cat.category)}
				<li>
					<a
						href="{resolve('/tools')}?category={cat.category}"
						class="group block rounded-2xl border border-border bg-bg-elevated p-6 no-underline transition-all duration-300 hover:border-border hover:shadow-premium-hover"
					>
						<span
							class="mb-4 block text-xl text-muted transition-colors group-hover:text-fg"
							aria-hidden="true"
						>
							<CategoryIcon kind={cat.kind} size={20} />
						</span>
						<span class="block text-lg font-medium text-fg">{cat.title}</span>
						<p class="mt-1 text-sm text-muted">{cat.blurb}</p>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Popular tools + packs (existing functionality, below fold) -->
	<section
		class="mx-auto max-w-7xl border-t border-border px-4 pt-16 pb-8 sm:px-6 lg:px-8"
		aria-labelledby="featured-heading"
	>
		<div class="mb-8 flex flex-wrap items-end justify-between gap-4">
			<div>
				<h2 id="featured-heading" class="font-display text-3xl text-fg">Popular tools</h2>
				<p class="mt-2 font-light text-muted">Start with the tools people open every day.</p>
			</div>
			<a href={resolve('/tools')} class="text-sm font-medium text-fg no-underline hover:underline"
				>View all tools →</a
			>
		</div>
		<ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
	</section>

	<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8" aria-labelledby="packs-heading">
		<h2 id="packs-heading" class="font-display text-3xl text-fg">Tool packs</h2>
		<p class="mt-2 max-w-xl font-light text-muted">
			Curated workflows for common jobs—no account required.
		</p>
		<ul class="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.collections as pack (pack.id)}
				<li
					id="pack-{pack.id}"
					class="flex scroll-mt-24 flex-col rounded-2xl border border-border bg-bg-elevated p-5 transition-all duration-300 hover:border-border hover:shadow-premium-hover"
				>
					<div class="flex items-start gap-3">
						<CategoryBadge kind={packIcons[pack.id] ?? 'spark'} size="md" />
						<div class="min-w-0">
							<h3 class="font-display text-lg font-semibold tracking-tight text-fg">
								{pack.name}
							</h3>
							<p class="mt-1.5 text-sm text-pretty text-muted">{pack.description}</p>
						</div>
					</div>
					<ul class="mt-5 space-y-1.5 border-t border-border pt-4">
						{#each pack.tools.slice(0, 5) as tool (tool.id)}
							<li>
								<a
									href={resolve(`/tools/${tool.id}`)}
									class="inline-flex items-center gap-1.5 text-sm font-medium text-fg no-underline hover:underline"
								>
									<span class="text-muted" aria-hidden="true">→</span>
									{tool.name}
								</a>
							</li>
						{/each}
					</ul>
					<a
						href={resolve(`/tools/${pack.tools[0]?.id}`)}
						class="mt-5 inline-flex text-sm font-semibold text-fg no-underline hover:underline"
					>
						Start with {pack.tools[0]?.name ?? 'first tool'} →
					</a>
				</li>
			{/each}
		</ul>
		<div class="mt-10 flex justify-center">
			<Button href="/tools" size="lg">Browse all tools</Button>
		</div>
	</section>
</main>
