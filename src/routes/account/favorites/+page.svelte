<script lang="ts">
	import { resolve } from '$app/paths';
	import { site } from '$lib/config/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Favorites | {site.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<h2 class="font-display text-2xl font-semibold tracking-tight">Favorites</h2>

{#if data.favorites.length === 0}
	<p class="mt-4 text-muted">No favorites yet. Open a tool and star it.</p>
{:else}
	<ul class="mt-6 grid gap-4 sm:grid-cols-2">
		{#each data.favorites as item (item.id)}
			<li class="rounded-md border border-border bg-bg-elevated p-5">
				<a
					href={resolve(`/tools/${item.toolId}`)}
					class="font-display text-lg font-semibold text-fg no-underline hover:text-accent"
				>
					{item.name}
				</a>
				<p class="mt-1 text-sm text-pretty text-muted">{item.description}</p>
			</li>
		{/each}
	</ul>
{/if}
