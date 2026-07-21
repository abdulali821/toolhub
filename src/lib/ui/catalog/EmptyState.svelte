<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from '$ui/primitives/Button.svelte';

	type Props = {
		title: string;
		description?: string;
		actionHref?: string;
		actionLabel?: string;
		extra?: Snippet;
	};

	let { title, description, actionHref, actionLabel = 'Browse tools', extra }: Props = $props();
</script>

<div
	class="flex flex-col items-start rounded-lg border border-dashed border-border bg-bg/50 px-6 py-10 sm:items-center sm:text-center"
>
	<p class="font-display text-lg font-semibold tracking-tight text-fg">{title}</p>
	{#if description}
		<p class="mt-2 max-w-md text-sm text-pretty text-muted">{description}</p>
	{/if}
	{#if extra}
		<div class="mt-4">{@render extra()}</div>
	{/if}
	{#if actionHref}
		<div class="mt-6">
			<Button href={actionHref} variant="secondary" size="sm">{actionLabel}</Button>
		</div>
	{/if}
</div>
