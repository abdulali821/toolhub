<script lang="ts">
	import { resolve } from '$app/paths';
	import { Container, SeoHead } from '$ui';
	import JsonLd from '$ui/seo/JsonLd.svelte';
	import CategoryBadge from '$ui/catalog/CategoryBadge.svelte';
	import { categoryIconKind, isCategoryId } from '$ui/catalog/category-meta';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<SeoHead seo={data.seo} />
</svelte:head>

{#if data.jsonLd?.length}
	<JsonLd data={data.jsonLd} />
{/if}

<main id="main">
	<Container class="py-10 sm:py-14">
		<header class="max-w-3xl">
			<h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
				Categories
			</h1>
			<p class="mt-3 text-base text-pretty text-muted sm:text-lg">
				Jump into a focused set of free browser tools—each category has its own landing page for
				discovery.
			</p>
		</header>

		<ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.categories as category (category.id)}
				{@const kind = isCategoryId(category.id) ? categoryIconKind[category.id] : 'spark'}
				<li>
					<a
						href={resolve(`/categories/${category.id}`)}
						class="flex h-full flex-col gap-3 rounded-2xl border border-border bg-bg-elevated p-5 no-underline shadow-premium transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-premium-hover"
					>
						<div class="flex items-center gap-3">
							<CategoryBadge {kind} size="md" />
							<div>
								<p class="font-medium text-fg">{category.label}</p>
								<p class="text-xs text-muted">{category.count} tools</p>
							</div>
						</div>
						<p class="text-sm text-pretty text-muted">{category.description}</p>
					</a>
				</li>
			{/each}
		</ul>
	</Container>
</main>
