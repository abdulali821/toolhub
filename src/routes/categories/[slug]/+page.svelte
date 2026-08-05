<script lang="ts">
	import { resolve } from '$app/paths';
	import { Container, SeoHead } from '$ui';
	import JsonLd from '$ui/seo/JsonLd.svelte';
	import ToolCard from '$ui/catalog/ToolCard.svelte';
	import Breadcrumb from '$ui/navigation/Breadcrumb.svelte';
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
		<Breadcrumb
			items={[
				{ label: 'Home', href: '/' },
				{ label: 'Tools', href: '/tools' },
				{ label: data.category.label }
			]}
		/>

		<header class="mt-6 max-w-3xl sm:mt-8">
			<p class="text-xs font-semibold tracking-widest text-muted uppercase">Category</p>
			<h1
				class="mt-2 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl"
			>
				{data.category.label}
			</h1>
			<p class="mt-3 text-base text-pretty text-muted sm:mt-4 sm:text-lg">
				{data.category.description}
			</p>
			<p class="mt-4 text-sm text-muted">
				{data.tools.length} tool{data.tools.length === 1 ? '' : 's'} ·
				<a href={resolve('/tools')} class="font-medium text-fg no-underline hover:underline"
					>Browse all tools</a
				>
			</p>
		</header>

		{#if data.tools.length}
			<ul class="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
		{/if}
	</Container>
</main>
