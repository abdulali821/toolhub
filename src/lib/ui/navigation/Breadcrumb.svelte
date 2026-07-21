<script lang="ts">
	import { resolve } from '$app/paths';

	type Crumb = { label: string; href?: string };

	type Props = {
		items: Crumb[];
	};

	let { items }: Props = $props();
</script>

<nav aria-label="Breadcrumb" class="text-sm text-muted">
	<ol class="flex flex-wrap items-center gap-2">
		{#each items as item, index (item.label + index)}
			<li class="flex items-center gap-2">
				{#if index > 0}
					<span aria-hidden="true">/</span>
				{/if}
				{#if item.href && index < items.length - 1}
					<a href={resolve(item.href as '/')} class="transition-colors hover:text-fg"
						>{item.label}</a
					>
				{:else}
					<span class="text-fg" aria-current={index === items.length - 1 ? 'page' : undefined}
						>{item.label}</span
					>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
