<script lang="ts">
	import { resolve } from '$app/paths';
	import { Container, SeoHead } from '$ui';
	import CategoryBadge from '$ui/catalog/CategoryBadge.svelte';
	import { accentForCategory, categoryIconKind, isCategoryId } from '$ui/catalog/category-meta';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

<main id="main">
	<Container class="py-12 sm:py-16">
		<p class="text-sm font-semibold tracking-[0.12em] text-accent uppercase">Browse</p>
		<h1 class="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Categories</h1>
		<p class="mt-3 max-w-xl text-muted">Pick a focus area, then open the tool you need.</p>

		<ul class="mt-10 grid gap-4 sm:grid-cols-2">
			{#each data.categories as category (category.id)}
				{@const accent = accentForCategory(category.id)}
				{@const kind = isCategoryId(category.id) ? categoryIconKind[category.id] : 'spark'}
				<li>
					<a
						href={resolve(`/categories/${category.id}`)}
						class="group relative block h-full overflow-hidden rounded-lg border border-border bg-bg-elevated p-6 no-underline shadow-sm transition-[border-color,transform,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
					>
						<span
							class="pointer-events-none absolute inset-y-0 left-0 w-0.5 opacity-80"
							style="background: {accent}"
							aria-hidden="true"
						></span>
						<div class="flex items-start gap-3">
							<CategoryBadge {kind} {accent} size="md" />
							<div class="min-w-0">
								<span
									class="font-display text-xl font-semibold tracking-tight text-fg transition-colors group-hover:text-accent"
								>
									{category.label}
								</span>
								<p class="mt-2 text-sm text-pretty text-muted">{category.description}</p>
								<p
									class="mt-5 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase"
									style="color: color-mix(in oklab, {accent} 55%, var(--color-muted));"
								>
									{category.count} tool{category.count === 1 ? '' : 's'}
								</p>
							</div>
						</div>
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
