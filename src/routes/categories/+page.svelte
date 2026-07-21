<script lang="ts">
	import { resolve } from '$app/paths';
	import { Container, SeoHead } from '$ui';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<main id="main">
	<Container class="py-12 sm:py-16">
		<p class="text-sm font-medium tracking-wide text-accent uppercase">Browse</p>
		<h1 class="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Categories</h1>
		<p class="mt-3 max-w-xl text-muted">Pick a focus area, then open the tool you need.</p>

		<ul class="mt-10 grid gap-4 sm:grid-cols-2">
			{#each data.categories as category (category.id)}
				<li>
					<a
						href={resolve(`/categories/${category.id}`)}
						class="group block h-full rounded-lg border border-border bg-bg-elevated p-6 no-underline transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
					>
						<span
							class="font-display text-xl font-semibold tracking-tight text-fg transition-colors group-hover:text-accent"
						>
							{category.label}
						</span>
						<p class="mt-2 text-sm text-pretty text-muted">{category.description}</p>
						<p class="mt-5 text-xs font-medium tracking-wide text-muted uppercase">
							{category.count} tool{category.count === 1 ? '' : 's'}
						</p>
					</a>
				</li>
			{/each}
		</ul>

		<p class="mt-10 text-sm text-muted">
			Or
			<a href={resolve('/search')} class="font-medium text-accent hover:underline"
				>search everything</a
			>.
		</p>
	</Container>
</main>
