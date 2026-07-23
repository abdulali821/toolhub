<script lang="ts">
	import { resolve } from '$app/paths';
	import CategoryIcon from './CategoryIcon.svelte';
	import { categoryIconKind, categoryLabel, isCategoryId } from './category-meta';

	type Props = {
		id: string;
		name: string;
		description: string;
		category?: string;
		categoryLabel?: string;
	};

	let { id, name, description, category, categoryLabel: labelProp }: Props = $props();

	const kind = $derived(category && isCategoryId(category) ? categoryIconKind[category] : 'spark');
	const label = $derived(labelProp ?? (category ? categoryLabel(category) : undefined));
</script>

<a
	href={resolve(`/tools/${id}`)}
	class="tool-card group flex h-full flex-col rounded-2xl border border-border bg-white p-5 no-underline shadow-premium transition-[box-shadow,transform,border-color] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:shadow-premium-hover"
>
	<span
		class="flex h-10 w-10 items-center justify-center rounded-xl bg-bg text-muted transition-colors duration-(--duration-fast) group-hover:bg-fg group-hover:text-white"
		aria-hidden="true"
	>
		<CategoryIcon {kind} size={18} />
	</span>

	<span class="mt-4 font-display text-lg font-semibold tracking-tight text-fg">
		{name}
	</span>
	<p class="mt-1.5 line-clamp-2 flex-1 text-sm text-pretty text-muted">{description}</p>
	{#if label}
		<span
			class="mt-4 inline-flex w-fit rounded-full bg-bg px-2.5 py-0.5 text-[11px] font-medium text-muted"
		>
			{label}
		</span>
	{/if}
</a>
