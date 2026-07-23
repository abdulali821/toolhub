<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount, untrack } from 'svelte';
	import { SeoHead } from '$ui';
	import EmptyState from '$ui/catalog/EmptyState.svelte';
	import CategoryIcon from '$ui/catalog/CategoryIcon.svelte';
	import {
		categoryIconKind,
		categoryLabel,
		isCategoryId,
		type CategoryIconKind
	} from '$ui/catalog/category-meta';
	import { listCollections } from '$lib/config/collections';
	import { listTools } from '$tools';
	import type { ToolSummary } from '$engine/types';
	import type { CategoryId } from '$lib/config/site';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type SortId = 'relevance' | 'popular' | 'name-asc' | 'name-desc';

	const SORT_OPTIONS: { id: SortId; label: string }[] = [
		{ id: 'relevance', label: 'Relevance' },
		{ id: 'popular', label: 'Popular' },
		{ id: 'name-asc', label: 'Name A–Z' },
		{ id: 'name-desc', label: 'Name Z–A' }
	];

	const PREVIEW_LIMIT = 12;

	function parseSort(value: string): SortId {
		return (['relevance', 'popular', 'name-asc', 'name-desc'] as const).includes(value as SortId)
			? (value as SortId)
			: 'relevance';
	}

	// Intentional initial capture for editable URL mirrors (SSR + live typing).
	let query = $state(untrack(() => data.q));
	let category = $state(untrack(() => data.category));
	let sort = $state<SortId>(untrack(() => parseSort(data.sort)));
	let sortOpen = $state(false);
	let filterOpen = $state(false);
	let urlTimer: ReturnType<typeof setTimeout> | undefined;

	const catalog = listTools();
	const popularRank = $derived(
		new Map<string, number>(
			data.popularIds.map((id, index) => [id, data.popularIds.length - index])
		)
	);

	onMount(() => {
		const onPopState = () => {
			const params = new URLSearchParams(window.location.search);
			query = params.get('q') ?? '';
			category = params.get('category') ?? '';
			sort = parseSort(params.get('sort') ?? 'relevance');
		};

		document.addEventListener('click', onDocClick);
		window.addEventListener('popstate', onPopState);
		return () => {
			document.removeEventListener('click', onDocClick);
			window.removeEventListener('popstate', onPopState);
			clearTimeout(urlTimer);
		};
	});

	function scoreTool(tool: ToolSummary, q: string): number {
		const needle = q.trim().toLowerCase();
		if (!needle) return 0;
		const id = tool.id.toLowerCase();
		const name = tool.name.toLowerCase();
		const description = tool.description.toLowerCase();
		const tags = tool.tags.map((t) => t.toLowerCase());
		const hay = `${id} ${name} ${description} ${tags.join(' ')}`;
		let score = 0;
		if (id === needle) score += 100;
		if (name === needle) score += 80;
		if (id.startsWith(needle) || name.startsWith(needle)) score += 40;
		if (hay.includes(needle)) score += 20;
		for (const token of needle.split(/\s+/).filter(Boolean)) {
			if (id.includes(token)) score += 12;
			if (name.includes(token)) score += 10;
			if (tags.includes(token)) score += 8;
			if (description.includes(token)) score += 3;
		}
		return score;
	}

	const matched = $derived.by(() => {
		const q = query.trim();
		const cat = category as CategoryId | '';
		let rows = catalog.filter((tool) => {
			if (cat && tool.category !== cat) return false;
			if (q && scoreTool(tool, q) <= 0) return false;
			return true;
		});

		if (!q && !cat) {
			rows = data.popularIds
				.map((id) => catalog.find((t) => t.id === id))
				.filter((t): t is ToolSummary => t != null);
		} else if (!q && cat) {
			rows = rows
				.slice()
				.sort(
					(a, b) =>
						(popularRank.get(b.id) ?? 0) - (popularRank.get(a.id) ?? 0) ||
						a.name.localeCompare(b.name)
				);
		}

		const mode: SortId = !q && sort === 'relevance' ? 'popular' : sort;

		rows = rows.slice().sort((a, b) => {
			if (mode === 'name-asc') return a.name.localeCompare(b.name);
			if (mode === 'name-desc') return b.name.localeCompare(a.name);
			if (mode === 'popular') {
				return (
					(popularRank.get(b.id) ?? 0) - (popularRank.get(a.id) ?? 0) ||
					a.name.localeCompare(b.name)
				);
			}
			// relevance
			if (q) {
				return scoreTool(b, q) - scoreTool(a, q) || a.name.localeCompare(b.name);
			}
			return (
				(popularRank.get(b.id) ?? 0) - (popularRank.get(a.id) ?? 0) || a.name.localeCompare(b.name)
			);
		});

		return rows;
	});

	const totalCount = $derived(matched.length);
	const preview = $derived(matched.slice(0, PREVIEW_LIMIT));
	const headTools = $derived(preview.slice(0, 3));
	const tailTools = $derived(preview.slice(3));

	const recommendedPack = $derived.by(() => {
		const q = query.trim();
		if (!q || matched.length === 0) return null;
		const toolIds = new Set(matched.map((t) => t.id));
		let best: {
			id: string;
			name: string;
			description: string;
			overlap: string[];
			extra: number;
		} | null = null;
		for (const pack of listCollections()) {
			const overlapIds = pack.toolIds.filter((id) => toolIds.has(id));
			if (overlapIds.length < 2) continue;
			if (!best || overlapIds.length > best.overlap.length) {
				const names = overlapIds
					.map((id) => matched.find((t) => t.id === id)?.name)
					.filter((n): n is string => Boolean(n));
				best = {
					id: pack.id,
					name: pack.name,
					description: pack.description,
					overlap: names.slice(0, 3),
					extra: Math.max(0, pack.toolIds.length - 3)
				};
			}
		}
		return best;
	});

	const sortLabel = $derived(SORT_OPTIONS.find((o) => o.id === sort)?.label ?? 'Relevance');
	const filterLabel = $derived(
		category
			? (data.categories.find((c) => c.id === category)?.label ?? 'Filter')
			: 'All categories'
	);

	function openToolsCatalog() {
		const params = new SvelteURLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		if (category) params.set('category', category);
		const qs = params.toString();
		const href = qs ? `${resolve('/tools')}?${qs}` : resolve('/tools');
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved /tools + search params
		void goto(href);
	}

	const showLoadMore = $derived(preview.length > 0);

	function syncUrl() {
		const params = new SvelteURLSearchParams();
		if (query.trim()) params.set('q', query.trim());
		if (category) params.set('category', category);
		if (sort !== 'relevance') params.set('sort', sort);
		const qs = params.toString();
		const href = qs ? `${resolve('/search')}?${qs}` : resolve('/search');
		// Query string appended after resolve(); path is always /search.
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolved base path + search params
		void goto(href, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function scheduleUrlSync() {
		clearTimeout(urlTimer);
		urlTimer = setTimeout(syncUrl, 250);
	}

	function onQueryInput(value: string) {
		query = value;
		scheduleUrlSync();
	}

	function clearQuery() {
		query = '';
		syncUrl();
	}

	function setSort(next: SortId) {
		sort = next;
		sortOpen = false;
		syncUrl();
	}

	function setCategory(next: string) {
		category = next;
		filterOpen = false;
		syncUrl();
	}

	function kindFor(tool: ToolSummary): CategoryIconKind {
		return tool.category && isCategoryId(tool.category) ? categoryIconKind[tool.category] : 'spark';
	}

	function onDocClick(event: MouseEvent) {
		const target = event.target as HTMLElement | null;
		if (!target?.closest('[data-menu="sort"]')) sortOpen = false;
		if (!target?.closest('[data-menu="filter"]')) filterOpen = false;
	}
</script>

{#snippet resultCard(tool: ToolSummary)}
	{@const kind = kindFor(tool)}
	{@const label = categoryLabel(tool.category)}
	<a
		href={resolve(`/tools/${tool.id}`)}
		class="group block rounded-2xl border border-gray-200 bg-white p-6 no-underline transition-all duration-300 hover:border-gray-300 hover:shadow-premium-hover"
	>
		<div class="flex items-start gap-5">
			<span
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-600 transition-colors group-hover:border-transparent group-hover:bg-gray-900 group-hover:text-white"
				aria-hidden="true"
			>
				<CategoryIcon {kind} size={20} />
			</span>
			<div class="min-w-0 flex-1">
				<div class="mb-1 flex flex-wrap items-center gap-2">
					<span class="text-lg font-medium text-gray-900">{tool.name}</span>
					<span class="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
						>{label}</span
					>
				</div>
				<p class="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-500">{tool.description}</p>
				<div class="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-400">
					<span class="inline-flex items-center gap-1">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
							><path d="M13 2L4 14h7l-1 8 10-14h-7l0-6z" /></svg
						>
						Instant
					</span>
					<span class="inline-flex items-center gap-1">
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"
							><path
								d="M12 3l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"
								stroke="currentColor"
								stroke-width="1.75"
								stroke-linejoin="round"
							/></svg
						>
						Local execution
					</span>
				</div>
			</div>
			<span
				class="hidden shrink-0 translate-x-2 items-center justify-center text-gray-300 transition-all duration-300 group-hover:translate-x-0 group-hover:text-gray-900 sm:flex"
				aria-hidden="true"
			>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
					<path
						d="M5 12h14M13 6l6 6-6 6"
						stroke="currentColor"
						stroke-width="1.75"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</span>
		</div>
	</a>
{/snippet}

{#snippet menuItem(active: boolean, label: string, onclick: () => void)}
	<button
		type="button"
		role="option"
		aria-selected={active}
		class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors {active
			? 'bg-gray-900 text-white'
			: 'text-gray-700 hover:bg-gray-50'}"
		{onclick}
	>
		{label}
		{#if active}
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<path
					d="M5 12l5 5L20 7"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		{/if}
	</button>
{/snippet}

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<main id="main" class="w-full flex-1 bg-white pt-8 pb-20 sm:pt-10">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<section id="search-header" class="mx-auto mb-10 max-w-4xl">
			<div class="group relative">
				<label class="sr-only" for="search-q">Search</label>
				<span
					class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 transition-colors group-focus-within:text-gray-900"
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
				<input
					id="search-q"
					value={query}
					oninput={(e) => onQueryInput(e.currentTarget.value)}
					placeholder="Search tools by name or task…"
					autocomplete="off"
					autocorrect="off"
					spellcheck="false"
					class="block w-full rounded-2xl border border-gray-200 bg-white py-4 pr-12 pl-12 leading-5 text-gray-900 shadow-sm transition-shadow duration-300 placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 focus:outline-none sm:text-lg"
				/>
				{#if query}
					<button
						type="button"
						class="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors hover:text-gray-600"
						aria-label="Clear search"
						onclick={clearQuery}
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M6 6l12 12M18 6L6 18"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					</button>
				{/if}
			</div>

			<div class="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
				<p class="text-sm font-medium text-gray-500">
					{#if query.trim()}
						Showing <span class="font-semibold text-gray-900">{totalCount}</span>
						result{totalCount === 1 ? '' : 's'} for “{query.trim()}”
					{:else if category}
						Showing <span class="font-semibold text-gray-900">{totalCount}</span>
						tool{totalCount === 1 ? '' : 's'} in {filterLabel}
					{:else}
						Popular tools · <span class="font-semibold text-gray-900">{totalCount}</span>
					{/if}
				</p>

				<div class="flex flex-wrap items-center gap-3">
					<span class="text-sm text-gray-500">Sort by:</span>

					<div class="relative" data-menu="sort">
						<button
							type="button"
							class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
							aria-haspopup="listbox"
							aria-expanded={sortOpen}
							onclick={(e) => {
								e.stopPropagation();
								sortOpen = !sortOpen;
								filterOpen = false;
							}}
						>
							{sortLabel}
							<svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M6 9l6 6 6-6"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								/>
							</svg>
						</button>
						{#if sortOpen}
							<div
								class="absolute top-full right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-premium-hover"
								role="listbox"
								aria-label="Sort results"
							>
								{#each SORT_OPTIONS as option (option.id)}
									{@render menuItem(sort === option.id, option.label, () => setSort(option.id))}
								{/each}
							</div>
						{/if}
					</div>

					<div class="relative" data-menu="filter">
						<button
							type="button"
							class="inline-flex max-w-56 items-center gap-2 truncate rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
							aria-haspopup="listbox"
							aria-expanded={filterOpen}
							onclick={(e) => {
								e.stopPropagation();
								filterOpen = !filterOpen;
								sortOpen = false;
							}}
						>
							<svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M4 6h16M7 12h10M10 18h4"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linecap="round"
								/>
							</svg>
							<span class="truncate">{category ? filterLabel : 'Filter'}</span>
						</button>
						{#if filterOpen}
							<div
								class="absolute top-full right-0 z-20 mt-2 max-h-72 w-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-premium-hover"
								role="listbox"
								aria-label="Filter by category"
							>
								{@render menuItem(!category, 'All categories', () => setCategory(''))}
								{#each data.categories as cat (cat.id)}
									{@render menuItem(category === cat.id, cat.label, () => setCategory(cat.id))}
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</section>

		<section id="search-results" class="mx-auto max-w-4xl">
			{#if preview.length}
				<ul class="flex flex-col gap-4">
					{#each headTools as tool (tool.id)}
						<li>{@render resultCard(tool)}</li>
					{/each}

					{#if recommendedPack}
						<li class="my-4 rounded-2xl border border-gray-200 bg-gray-50 p-6">
							<div class="mb-4 flex items-center gap-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white"
									aria-hidden="true"
								>
									<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
										<path
											d="M4 6h16M4 12h16M4 18h10"
											stroke="currentColor"
											stroke-width="1.75"
											stroke-linecap="round"
										/>
									</svg>
								</div>
								<div>
									<p class="text-sm font-medium text-gray-900">Recommended Tool Pack</p>
									<p class="text-xs text-gray-500">Curated tools matching your search</p>
								</div>
							</div>
							<div
								class="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center"
							>
								<div>
									<p class="mb-1 font-medium text-gray-900">{recommendedPack.name}</p>
									<p class="text-sm text-gray-500">
										{#if recommendedPack.overlap.length}
											Includes {recommendedPack.overlap.join(', ')}{#if recommendedPack.extra > 0},
												and {recommendedPack.extra} more tools.{:else}.{/if}
										{:else}
											{recommendedPack.description}
										{/if}
									</p>
								</div>
								<a
									href={resolve(`/#pack-${recommendedPack.id}`)}
									class="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 no-underline transition-colors hover:bg-gray-50"
								>
									View Pack
								</a>
							</div>
						</li>
					{/if}

					{#each tailTools as tool (tool.id)}
						<li>{@render resultCard(tool)}</li>
					{/each}
				</ul>

				{#if showLoadMore}
					<div class="mt-10 text-center">
						<button
							type="button"
							onclick={openToolsCatalog}
							class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
						>
							Load more results
						</button>
					</div>
				{/if}
			{:else}
				<div class="mt-2">
					<EmptyState
						title="Nothing matched"
						description="Try a shorter keyword, or browse the full catalog."
						actionHref="/tools"
						actionLabel="Browse all tools"
					/>
				</div>
			{/if}
		</section>
	</div>
</main>
