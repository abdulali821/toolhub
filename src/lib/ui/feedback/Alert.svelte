<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'info' | 'success' | 'warning' | 'danger';

	type Props = {
		variant?: Variant;
		title?: string;
		children: Snippet;
	};

	let { variant = 'info', title, children }: Props = $props();

	const role = $derived(variant === 'danger' || variant === 'warning' ? 'alert' : 'status');

	const styles: Record<Variant, string> = {
		info: 'bg-info-bg text-info border-info/30',
		success: 'bg-success-bg text-success border-success/30',
		warning: 'bg-warning-bg text-warning border-warning/30',
		danger: 'bg-danger-bg text-danger border-danger/30'
	};
</script>

<div class="rounded-md border px-4 py-3 {styles[variant]}" {role}>
	{#if title}
		<p class="mb-1 font-medium">{title}</p>
	{/if}
	<div class="text-sm [&_a]:underline">
		{@render children()}
	</div>
</div>
