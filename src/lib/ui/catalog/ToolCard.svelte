<script lang="ts">
	import { resolve } from '$app/paths';
	import CategoryBadge from './CategoryBadge.svelte';
	import {
		accentForCategory,
		categoryIconKind,
		categoryLabel,
		isCategoryId
	} from './category-meta';

	type Props = {
		id: string;
		name: string;
		description: string;
		category?: string;
		categoryLabel?: string;
	};

	let { id, name, description, category, categoryLabel: labelProp }: Props = $props();

	const accent = $derived(accentForCategory(category));
	const kind = $derived(category && isCategoryId(category) ? categoryIconKind[category] : 'spark');
	const label = $derived(labelProp ?? (category ? categoryLabel(category) : undefined));
</script>

<a
	href={resolve(`/tools/${id}`)}
	class="tool-card group relative block overflow-hidden rounded-lg border border-border bg-bg-elevated p-5 no-underline shadow-sm transition-[border-color,transform,box-shadow] duration-(--duration-base) ease-out hover:-translate-y-0.5 hover:border-accent/35 hover:shadow-md"
>
	<span
		class="pointer-events-none absolute inset-y-0 left-0 w-0.5 opacity-80 transition-opacity group-hover:opacity-100"
		style="background: {accent}"
		aria-hidden="true"
	></span>

	<div class="flex items-start gap-3">
		{#if category && isCategoryId(category)}
			<CategoryBadge {kind} {accent} size="sm" />
		{/if}
		<div class="min-w-0 flex-1">
			<span
				class="font-display text-lg font-semibold tracking-tight text-fg transition-colors duration-(--duration-fast) group-hover:text-accent"
			>
				{name}
			</span>
			<p class="mt-1.5 line-clamp-2 text-sm text-pretty text-muted">{description}</p>
			{#if label}
				<p
					class="mt-3 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase"
					style="color: color-mix(in oklab, {accent} 55%, var(--color-muted));"
				>
					{label}
				</p>
			{/if}
		</div>
	</div>
</a>
