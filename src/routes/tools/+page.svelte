<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button, Container, SeoHead } from '$ui';
	import ToolCard from '$ui/catalog/ToolCard.svelte';
	import EmptyState from '$ui/catalog/EmptyState.svelte';
	import CategoryBadge from '$ui/catalog/CategoryBadge.svelte';
	import { categoryIconKind, isCategoryId } from '$ui/catalog/category-meta';
	import { categories } from '$lib/config/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const user = $derived(page.data.user as { id: string; email?: string } | null | undefined);
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<main id="main">
	<Container class="py-10 sm:py-14">
		<div class="flex flex-col gap-8 lg:flex-row lg:gap-10">
			<aside
				class="w-full shrink-0 rounded-2xl border border-border bg-white p-5 shadow-premium lg:w-56"
				aria-label="Catalog filters"
			>
				<p class="text-[11px] font-semibold tracking-wider text-muted uppercase">Categories</p>
				<ul class="mt-3 space-y-0.5">
					<li>
						<a
							href={resolve('/tools')}
							class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm no-underline transition-colors {!data.category
								? 'bg-bg font-medium text-fg'
								: 'text-muted hover:bg-bg hover:text-fg'}"
							aria-current={!data.category ? 'page' : undefined}
						>
							<span class="text-muted" aria-hidden="true">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
									><path
										d="M4 6h16M4 12h16M4 18h10"
										stroke="currentColor"
										stroke-width="1.75"
										stroke-linecap="round"
									/></svg
								>
							</span>
							All Tools
						</a>
					</li>
					{#each categories as category (category.id)}
						{@const kind = isCategoryId(category.id) ? categoryIconKind[category.id] : 'spark'}
						{@const active = data.category === category.id}
						<li>
							<a
								href={resolve(`/tools?category=${category.id}`)}
								class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm no-underline transition-colors {active
									? 'bg-bg font-medium text-fg'
									: 'text-muted hover:bg-bg hover:text-fg'}"
								aria-current={active ? 'page' : undefined}
							>
								<CategoryBadge {kind} size="sm" />
								<span class="truncate">{category.label.replace(' Tools', '')}</span>
							</a>
						</li>
					{/each}
				</ul>

				<p class="mt-6 text-[11px] font-semibold tracking-wider text-muted uppercase">
					Collections
				</p>
				<ul class="mt-3 space-y-0.5">
					<li>
						<a
							href={resolve(user ? '/account/favorites' : '/login')}
							class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted no-underline transition-colors hover:bg-bg hover:text-fg"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path
									d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18.4l.9-5.4L4.2 9.2l5.4-.8L12 3.5z"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linejoin="round"
								/>
							</svg>
							Starred
						</a>
					</li>
					<li>
						<a
							href={resolve(user ? '/account/history' : '/login')}
							class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted no-underline transition-colors hover:bg-bg hover:text-fg"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.5" />
								<path
									d="M12 8v4l3 2"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
								/>
							</svg>
							Recent
						</a>
					</li>
				</ul>
			</aside>

			<div class="min-w-0 flex-1">
				<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">All Tools</h1>
					<form method="GET" class="flex w-full gap-2 sm:max-w-md" action={resolve('/tools')}>
						{#if data.category}
							<input type="hidden" name="category" value={data.category} />
						{/if}
						<label class="sr-only" for="tool-search">Search tools</label>
						<div class="relative min-w-0 flex-1">
							<svg
								class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.75" />
								<path
									d="M20 20l-3.5-3.5"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linecap="round"
								/>
							</svg>
							<input
								id="tool-search"
								name="q"
								value={data.q}
								placeholder="Search tools..."
								class="h-11 w-full rounded-xl border border-border bg-white pr-3 pl-10 text-sm text-fg shadow-sm transition-[border-color,box-shadow] focus:border-fg/30 focus:shadow-ring focus:outline-none"
							/>
						</div>
						<Button type="submit" class="h-11 shrink-0">Filter</Button>
					</form>
				</div>

				{#if data.tools.length}
					<ul class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{#each data.tools as tool (tool.id)}
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
				{:else}
					<div class="mt-10">
						<EmptyState
							title="No tools match"
							description="Try a different keyword or clear the category filter."
							actionHref="/tools"
							actionLabel="Clear filters"
						/>
					</div>
				{/if}
			</div>
		</div>
	</Container>
</main>
