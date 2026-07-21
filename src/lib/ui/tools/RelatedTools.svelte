<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ToolSummary } from '$engine/types';

	type Props = {
		tools: ToolSummary[];
		title?: string;
	};

	let { tools, title = 'Related tools' }: Props = $props();
</script>

<section aria-labelledby="related-tools-heading">
	<h2 id="related-tools-heading" class="font-display text-2xl font-semibold tracking-tight">
		{title}
	</h2>
	<ul class="mt-6 grid gap-3 sm:grid-cols-2">
		{#each tools as tool (tool.id)}
			<li
				class="rounded-lg border border-border bg-bg-elevated p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md"
			>
				<a
					href={resolve(`/tools/${tool.id}`)}
					class="font-display text-lg font-semibold text-fg no-underline transition-colors hover:text-accent"
				>
					{tool.name}
				</a>
				<p class="mt-1.5 line-clamp-2 text-sm text-pretty text-muted">{tool.description}</p>
			</li>
		{/each}
	</ul>
</section>
