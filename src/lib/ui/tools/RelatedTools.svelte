<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ToolSummary } from '$engine/types';

	type Props = {
		tools: ToolSummary[];
		title?: string;
		compact?: boolean;
	};

	let { tools, title = 'Related tools', compact = false }: Props = $props();
</script>

<section aria-labelledby="related-tools-heading">
	<h2
		id="related-tools-heading"
		class={compact
			? 'text-xs font-semibold tracking-wider text-muted uppercase'
			: 'font-display text-2xl font-semibold tracking-tight'}
	>
		{title}
	</h2>
	<ul class={compact ? 'mt-4 space-y-3' : 'mt-6 grid gap-3 sm:grid-cols-2'}>
		{#each tools as tool (tool.id)}
			<li
				class={compact
					? ''
					: 'rounded-2xl border border-border bg-white p-4 shadow-premium transition-[box-shadow,transform] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:shadow-premium-hover'}
			>
				<a
					href={resolve(`/tools/${tool.id}`)}
					class={compact
						? 'block no-underline'
						: 'font-display text-lg font-semibold text-fg no-underline transition-colors hover:text-muted'}
				>
					{#if compact}
						<span class="text-sm font-medium text-fg hover:underline">{tool.name}</span>
						<p class="mt-0.5 line-clamp-2 text-xs text-muted">{tool.description}</p>
					{:else}
						{tool.name}
					{/if}
				</a>
				{#if !compact}
					<p class="mt-1.5 line-clamp-2 text-sm text-pretty text-muted">{tool.description}</p>
				{/if}
			</li>
		{/each}
	</ul>
</section>
