<script lang="ts">
	import { formatBytes } from '$lib/utils/bytes';
	import { validateFile, type FileConstraints } from '$lib/utils/file';

	type Props = {
		constraints: FileConstraints;
		label?: string;
		hint?: string;
		disabled?: boolean;
		onselect: (file: File) => void;
		onerror?: (message: string) => void;
	};

	let {
		constraints,
		label = 'Drop a file here or browse',
		hint,
		disabled = false,
		onselect,
		onerror
	}: Props = $props();

	let dragging = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	function handleFiles(list: FileList | null) {
		const file = list?.[0];
		if (!file) return;
		const result = validateFile(file, constraints);
		if (!result.ok) {
			onerror?.(result.error);
			return;
		}
		onselect(result.file);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		if (disabled) return;
		handleFiles(event.dataTransfer?.files ?? null);
	}
</script>

<div
	role="button"
	tabindex={disabled ? -1 : 0}
	aria-disabled={disabled}
	class="rounded-lg border border-dashed px-4 py-8 text-center transition-colors {dragging
		? 'border-accent bg-accent/5'
		: 'border-border bg-bg-elevated'} {disabled
		? 'pointer-events-none opacity-50'
		: 'cursor-pointer'}"
	ondragenter={(e) => {
		e.preventDefault();
		dragging = true;
	}}
	ondragover={(e) => e.preventDefault()}
	ondragleave={() => {
		dragging = false;
	}}
	ondrop={onDrop}
	onclick={() => inputEl?.click()}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			inputEl?.click();
		}
	}}
>
	<p class="font-medium text-fg">{label}</p>
	{#if hint}
		<p class="mt-1 text-sm text-muted">{hint}</p>
	{:else}
		<p class="mt-1 text-sm text-muted">Max {formatBytes(constraints.maxBytes)}</p>
	{/if}

	<input
		bind:this={inputEl}
		type="file"
		class="sr-only"
		accept={constraints.accept}
		aria-label={label}
		{disabled}
		onchange={(e) => handleFiles((e.currentTarget as HTMLInputElement).files)}
	/>
</div>
