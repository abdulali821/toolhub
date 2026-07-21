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
	class="flex flex-col items-start rounded-xl border border-dashed border-border bg-bg/60 px-6 py-12 shadow-sm sm:items-center sm:px-10 sm:text-center"
>
	<div
		class="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated text-muted"
		aria-hidden="true"
	>
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
			<path
				d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16.5 16.5L21 21"
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</div>
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
