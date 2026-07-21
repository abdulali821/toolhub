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
	<ul class="mt-6 grid gap-4 sm:grid-cols-2">
		{#each tools as tool (tool.id)}
			<li class="rounded-md border border-border bg-bg-elevated p-4">
				<a
					href={resolve(`/tools/${tool.id}`)}
					class="font-display text-lg font-semibold text-fg no-underline hover:text-accent"
				>
					{tool.name}
				</a>
				<p class="mt-1 text-sm text-pretty text-muted">{tool.description}</p>
			</li>
		{/each}
	</ul>
</section>
