<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$ui';
	import { site } from '$lib/config/site';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>History | {site.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-3">
	<h2 class="font-display text-2xl font-semibold tracking-tight">History</h2>
	{#if data.history.length}
		<form method="POST" action="?/clear">
			<Button type="submit" variant="ghost" size="sm">Clear history</Button>
		</form>
	{/if}
</div>

{#if data.history.length === 0}
	<p class="mt-4 text-muted">No history yet. Visit a tool while signed in.</p>
{:else}
	<ul class="mt-6 space-y-3">
		{#each data.history as item (item.id)}
			<li
				class="flex flex-wrap items-baseline justify-between gap-2 rounded-md border border-border bg-bg-elevated px-4 py-3"
			>
				<div>
					<a
						href={resolve(`/tools/${item.toolId}`)}
						class="font-medium text-fg no-underline hover:text-accent"
					>
						{item.name}
					</a>
					<p class="text-sm text-muted">{item.description}</p>
				</div>
				<time class="text-xs text-muted" datetime={item.usedAt}>
					{new Date(item.usedAt).toLocaleString()}
				</time>
			</li>
		{/each}
	</ul>
{/if}
