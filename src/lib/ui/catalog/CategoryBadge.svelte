<script lang="ts">
	import type { CategoryIconKind } from './category-meta';
	import CategoryIcon from './CategoryIcon.svelte';

	type Props = {
		kind: CategoryIconKind;
		accent?: string;
		size?: 'sm' | 'md' | 'lg';
		label?: string;
	};

	let { kind, accent = 'var(--color-accent)', size = 'md', label }: Props = $props();

	const box = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
	const icon = size === 'sm' ? 15 : size === 'lg' ? 20 : 17;
</script>

<span
	class="inline-flex {box} shrink-0 items-center justify-center rounded-md border border-border/80"
	style="color: {accent}; background: color-mix(in oklab, {accent} 10%, var(--color-bg-elevated));"
	aria-hidden={label ? undefined : true}
	aria-label={label}
>
	<CategoryIcon {kind} size={icon} />
</span>
