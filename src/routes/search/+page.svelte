<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Container, SeoHead } from '$ui';
	import ToolCard from '$ui/catalog/ToolCard.svelte';
	import EmptyState from '$ui/catalog/EmptyState.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<main id="main">
	<Container class="py-12 sm:py-16">
		<p class="text-sm font-medium tracking-wide text-accent uppercase">Find a tool</p>
		<h1 class="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Search</h1>
		<p class="mt-3 max-w-xl text-muted">Search by name, tag, or what you’re trying to do.</p>

		<form
			method="GET"
			class="mt-8 flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-4 shadow-sm sm:flex-row sm:items-center"
			action={resolve('/search')}
		>
			<label class="sr-only" for="search-q">Search</label>
			<input
				id="search-q"
				name="q"
				value={data.q}
				placeholder="e.g. base64, jwt, password…"
				class="h-11 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 text-fg transition-[border-color,box-shadow] focus:border-accent/50 focus:shadow-(--shadow-ring) focus:outline-none"
			/>
			<label class="sr-only" for="search-category">Category</label>
			<select
				id="search-category"
				name="category"
				class="h-11 rounded-md border border-border bg-bg px-3 text-fg"
			>
				<option value="">All categories</option>
				{#each data.categories as category (category.id)}
					<option value={category.id} selected={data.category === category.id}
						>{category.label}</option
					>
				{/each}
			</select>
			<Button type="submit" class="h-11 shrink-0">Search</Button>
		</form>

		<p class="mt-6 text-sm text-muted">
			{#if data.q}
				{data.tools.length} result{data.tools.length === 1 ? '' : 's'} for “{data.q}”
			{:else}
				Showing all {data.tools.length} tools
			{/if}
		</p>

		{#if data.tools.length}
			<ul class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
			<div class="mt-6">
				<EmptyState
					title="Nothing matched"
					description="Try a shorter keyword, or browse the full catalog."
					actionHref="/tools"
					actionLabel="Browse all tools"
				/>
			</div>
		{/if}
	</Container>
</main>
