<script lang="ts">
	import type { Component } from 'svelte';
	import { Alert } from '$ui';

	type Props = {
		loader: () => Promise<{ default: Component }>;
	};

	let { loader }: Props = $props();

	let ToolUi = $state<Component | null>(null);
	let loadError = $state<string | null>(null);

	$effect(() => {
		let cancelled = false;
		loadError = null;
		ToolUi = null;

		loader()
			.then((mod) => {
				if (!cancelled) ToolUi = mod.default;
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					loadError = err instanceof Error ? err.message : 'Failed to load tool';
				}
			});

		return () => {
			cancelled = true;
		};
	});
</script>

{#if loadError}
	<Alert variant="danger" title="Tool failed to load">{loadError}</Alert>
{:else if ToolUi}
	<div class="animate-fade">
		<ToolUi />
	</div>
{:else}
	<div class="space-y-3 py-1" aria-live="polite" aria-busy="true">
		<p class="sr-only">Loading tool…</p>
		<div class="animate-pulse-soft h-10 rounded-md bg-border/50"></div>
		<div class="animate-pulse-soft h-28 rounded-md bg-border/40"></div>
		<div class="animate-pulse-soft h-10 w-2/5 rounded-md bg-border/45"></div>
	</div>
{/if}
