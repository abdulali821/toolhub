<script lang="ts">
	import type { CategoryIconKind } from './category-meta';
	import CategoryIcon from './CategoryIcon.svelte';

	type Props = {
		kind: CategoryIconKind;
		accent?: string;
		size?: 'sm' | 'md' | 'lg';
		label?: string;
	};

	let { kind, accent = 'var(--color-muted)', size = 'md', label }: Props = $props();

	const box = $derived(size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9');
	const icon = $derived(size === 'sm' ? 15 : size === 'lg' ? 20 : 17);
</script>

<span
	class="inline-flex {box} shrink-0 items-center justify-center rounded-lg border border-border/80 bg-bg"
	style="color: {accent};"
	aria-hidden={label ? undefined : true}
	aria-label={label}
>
	<CategoryIcon {kind} size={icon} />
</span>
