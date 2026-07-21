<script lang="ts">
	import { resolve } from '$app/paths';

	type Props = {
		id: string;
		name: string;
		description: string;
		category?: string;
		categoryLabel?: string;
	};

	let { id, name, description, category, categoryLabel }: Props = $props();
</script>

<a
	href={resolve(`/tools/${id}`)}
	class="tool-card group block rounded-lg border border-border bg-bg-elevated p-5 no-underline transition-[border-color,transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
>
	<span
		class="font-display text-lg font-semibold tracking-tight text-fg transition-colors group-hover:text-accent"
	>
		{name}
	</span>
	<p class="mt-2 text-sm text-pretty text-muted">{description}</p>
	{#if categoryLabel || category}
		<p class="mt-4 text-xs font-medium tracking-wide text-muted uppercase">
			{categoryLabel ?? category}
		</p>
	{/if}
</a>
