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
		<p class="text-sm font-medium tracking-wide text-accent uppercase">Category</p>
		<h1 class="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
			{data.category.label}
		</h1>
		<p class="mt-3 max-w-2xl text-muted">{data.category.description}</p>

		<form
			method="GET"
			class="mt-8 flex flex-col gap-3 rounded-lg border border-border bg-bg-elevated p-4 sm:flex-row sm:items-center"
			action={resolve(`/categories/${data.category.id}`)}
		>
			<label class="sr-only" for="category-search">Search in category</label>
			<input
				id="category-search"
				name="q"
				value={data.q}
				placeholder="Search in {data.category.label.toLowerCase()}…"
				class="h-11 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 text-fg"
			/>
			<Button type="submit" class="h-11 shrink-0">Search</Button>
		</form>

		<p class="mt-6 text-sm text-muted">
			{data.tools.length} tool{data.tools.length === 1 ? '' : 's'}
		</p>

		{#if data.tools.length}
			<ul class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.tools as tool (tool.id)}
					<li>
						<ToolCard id={tool.id} name={tool.name} description={tool.description} />
					</li>
				{/each}
			</ul>
		{:else}
			<div class="mt-6">
				<EmptyState
					title="No matches in this category"
					description="Try another keyword, or browse every tool."
					actionHref="/tools"
				/>
			</div>
		{/if}
	</Container>
</main>
