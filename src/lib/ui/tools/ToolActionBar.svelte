<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$ui/primitives/Button.svelte';
	import type { ToolCapability, ToolPreset } from '$engine/types';
	import { copyText, downloadText } from '$engine/share-state';
	import type { ToolShellActions } from './tool-shell-context';

	type Props = {
		capabilities?: ToolCapability[];
		presets?: ToolPreset[];
		shareParams?: string[];
		actions: ToolShellActions;
		favorited?: boolean;
		canFavorite?: boolean;
		loginHref?: string;
	};

	let {
		capabilities = [],
		presets = [],
		shareParams = [],
		actions,
		favorited = false,
		canFavorite = false,
		loginHref = '/login'
	}: Props = $props();

	const has = (cap: ToolCapability) => capabilities.includes(cap);

	let shareStatus = $state<'idle' | 'copied' | 'failed'>('idle');
	let copyStatus = $state<'idle' | 'copied' | 'failed'>('idle');

	function applyPreset(preset: ToolPreset) {
		const url = new URL(window.location.href);
		for (const [key, value] of Object.entries(preset.params)) {
			if (value === '') url.searchParams.delete(key);
			else url.searchParams.set(key, value);
		}
		goto(`${url.pathname}${url.search}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	async function onCopy() {
		const value = actions.copyValue ?? '';
		const ok = await copyText(value, actions.downloadMime);
		copyStatus = ok ? 'copied' : 'failed';
		setTimeout(() => {
			copyStatus = 'idle';
		}, 1500);
	}

	function onDownload() {
		const value = actions.downloadValue ?? actions.copyValue ?? '';
		if (!value) return;
		downloadText(
			actions.downloadFilename ?? 'heytools-output.txt',
			value,
			actions.downloadMime ?? 'text/plain;charset=utf-8'
		);
	}

	async function onShare() {
		const ok = await copyText(window.location.href);
		shareStatus = ok ? 'copied' : 'failed';
		setTimeout(() => {
			shareStatus = 'idle';
		}, 1500);
	}

	function onReset() {
		actions.onReset?.();
		if (shareParams.length) {
			const url = new URL(window.location.href);
			for (const key of shareParams) url.searchParams.delete(key);
			goto(url.pathname + url.search, { replaceState: true, keepFocus: true, noScroll: true });
		}
	}

	const primaryIsDownload = $derived(has('download') && !has('copy'));
</script>

{#if presets.length}
	<div class="mb-4 flex flex-wrap gap-2" role="group" aria-label="Presets">
		{#each presets as preset (preset.id)}
			<Button type="button" variant="ghost" size="sm" onclick={() => applyPreset(preset)}>
				{preset.label}
			</Button>
		{/each}
	</div>
{/if}

{#if capabilities.length}
	<div
		class="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2.5"
		role="toolbar"
		aria-label="Tool actions"
	>
		{#if has('copy')}
			<Button
				type="button"
				variant="primary"
				size="sm"
				onclick={onCopy}
				disabled={!actions.copyValue}
			>
				{copyStatus === 'copied' ? 'Copied' : 'Copy'}
			</Button>
		{/if}

		{#if has('download')}
			<Button
				type="button"
				variant={primaryIsDownload ? 'primary' : 'secondary'}
				size="sm"
				onclick={onDownload}
				disabled={!(actions.downloadValue ?? actions.copyValue)}
			>
				Download
			</Button>
		{/if}

		{#if has('copy') || has('download')}
			<span class="mx-0.5 hidden h-5 w-px bg-border sm:block" aria-hidden="true"></span>
		{/if}

		{#if has('reset')}
			<Button type="button" variant="ghost" size="sm" onclick={onReset}>Reset</Button>
		{/if}

		{#if has('share')}
			<Button type="button" variant="ghost" size="sm" onclick={onShare}>
				{shareStatus === 'copied' ? 'Link copied' : 'Share link'}
			</Button>
		{/if}

		{#if has('favorite')}
			{#if canFavorite}
				<form method="POST" action="?/toggleFavorite" class="inline">
					<input type="hidden" name="favorited" value={favorited ? '1' : '0'} />
					<Button type="submit" variant={favorited ? 'secondary' : 'ghost'} size="sm">
						{favorited ? 'Starred' : 'Star'}
					</Button>
				</form>
			{:else}
				<a href={loginHref} class="text-sm text-muted transition-colors hover:text-fg"
					>Sign in to star</a
				>
			{/if}
		{/if}
	</div>
{/if}
