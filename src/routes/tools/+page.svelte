<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Container, SeoHead } from '$ui';
	import ToolCard from '$ui/catalog/ToolCard.svelte';
	import EmptyState from '$ui/catalog/EmptyState.svelte';
	import { categories } from '$lib/config/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<main id="main">
	<Container class="py-12 sm:py-16">
		<p class="text-sm font-medium tracking-wide text-accent uppercase">Catalog</p>
		<h1 class="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Tools</h1>
		<p class="mt-3 max-w-xl text-muted">
			{data.tools.length} free tool{data.tools.length === 1 ? '' : 's'} — private by default, ready when
			you are.
		</p>

		<form
			method="GET"
			class="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-4 shadow-sm sm:flex-row sm:items-center"
			action={resolve('/tools')}
		>
			<label class="sr-only" for="tool-search">Search tools</label>
			<input
				id="tool-search"
				name="q"
				value={data.q}
				placeholder="Search tools…"
				class="h-11 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 text-fg transition-[border-color,box-shadow] focus:border-accent/50 focus:shadow-(--shadow-ring) focus:outline-none"
			/>
			<label class="sr-only" for="tool-category">Category</label>
			<select
				id="tool-category"
				name="category"
				class="h-11 rounded-md border border-border bg-bg px-3 text-fg"
			>
				<option value="">All categories</option>
				{#each categories as category (category.id)}
					<option value={category.id} selected={data.category === category.id}
						>{category.label}</option
					>
				{/each}
			</select>
			<Button type="submit" class="h-11 shrink-0">Filter</Button>
		</form>

		{#if data.tools.length}
			<ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
	</Container>
</main>
