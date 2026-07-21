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
	<ToolUi />
{:else}
	<p class="text-sm text-muted" aria-live="polite">Loading tool…</p>
{/if}
