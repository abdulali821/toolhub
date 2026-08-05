<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Button, Field, Input } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareBool, readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { downloadText } from '$engine/share-state';
	import { validateFile } from '$lib/utils/file';
	import {
		faviconGenerator,
		run,
		buildFaviconZip,
		normalizeInitials,
		pngFilename,
		type FaviconPng,
		type FaviconGeneratorInput,
		type FaviconGeneratorOutput
	} from './index';

	const shareKeys = faviconGenerator.share!.params;
	const DEFAULT_MODE: FaviconGeneratorInput['mode'] = 'text';
	const DEFAULT_TEXT = 'HT';
	const DEFAULT_BG = '#2563eb';
	const DEFAULT_FG = '#ffffff';
	const DEFAULT_ROUNDED = true;

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		const modeRaw = readShareParam(sp, 'mode');
		const mode: FaviconGeneratorInput['mode'] = modeRaw === 'image' ? 'image' : DEFAULT_MODE;
		const bg = readShareParam(sp, 'backgroundColor') ?? DEFAULT_BG;
		const fg = readShareParam(sp, 'textColor') ?? DEFAULT_FG;
		return {
			mode,
			text: normalizeInitials(readShareParam(sp, 'text') ?? DEFAULT_TEXT) || DEFAULT_TEXT,
			backgroundColor: bg.startsWith('#') ? bg : `#${bg}`,
			textColor: fg.startsWith('#') ? fg : `#${fg}`,
			rounded: readShareBool(sp, 'rounded', DEFAULT_ROUNDED)
		};
	}

	const initial = optionsFromUrl();
	let mode = $state<FaviconGeneratorInput['mode']>(initial.mode);
	let text = $state(initial.text);
	let backgroundColor = $state(initial.backgroundColor);
	let textColor = $state(initial.textColor);
	let rounded = $state(initial.rounded);
	let imageDataUrl = $state('');
	let imageName = $state('');
	let pngs = $state<FaviconPng[]>([]);
	let icoDataUrl = $state('');
	let icoBytes = $state<Uint8Array | null>(null);
	let html = $state('');
	let selectedSize = $state<number>(32);
	let downloadTarget = $state<'png' | 'ico'>('png');
	let error = $state<string | null>(null);
	let loading = $state(false);
	let zipping = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	let downloadValue = $derived(
		downloadTarget === 'ico'
			? icoDataUrl
			: (pngs.find((p) => p.size === selectedSize)?.dataUrl ?? '')
	);
	let downloadFilename = $derived(
		downloadTarget === 'ico' ? 'favicon.ico' : pngFilename(selectedSize)
	);

	function clearOutput() {
		pngs = [];
		icoDataUrl = '';
		icoBytes = null;
		html = '';
	}

	function applyOutput(out: FaviconGeneratorOutput) {
		pngs = out.pngs;
		icoDataUrl = out.icoDataUrl;
		icoBytes = out.icoBytes;
		html = out.html;
		if (!pngs.some((p) => p.size === selectedSize)) {
			selectedSize = pngs[0]?.size ?? 32;
		}
	}

	async function generate() {
		if (mode === 'image' && !imageDataUrl) {
			clearOutput();
			error = null;
			return;
		}
		if (mode === 'text' && !normalizeInitials(text)) {
			clearOutput();
			error = 'Enter 1–2 characters';
			return;
		}

		loading = true;
		error = null;
		try {
			const out = await run({
				mode,
				imageDataUrl: mode === 'image' ? imageDataUrl : undefined,
				text: mode === 'text' ? normalizeInitials(text) : undefined,
				backgroundColor,
				textColor,
				rounded
			});
			applyOutput(out);
		} catch (err) {
			clearOutput();
			error = err instanceof Error ? err.message : 'Failed to generate favicon';
		} finally {
			loading = false;
		}
	}

	function onModeChange(next: FaviconGeneratorInput['mode']) {
		mode = next;
		error = null;
		if (next === 'image' && !imageDataUrl) {
			clearOutput();
			return;
		}
		void generate();
	}

	function onTextInput(value: string) {
		text = normalizeInitials(value);
		void generate();
	}

	async function onFile(list: FileList | null) {
		if (!list?.[0]) return;
		const file = list[0];
		const result = validateFile(file, faviconGenerator.file!);
		if (!result.ok) {
			error = result.error;
			return;
		}
		error = null;
		imageName = file.name;
		const buffer = await file.arrayBuffer();
		const bytes = new Uint8Array(buffer);
		let binary = '';
		const chunk = 0x8000;
		for (let i = 0; i < bytes.length; i += chunk) {
			binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
		}
		const mime = file.type || 'image/png';
		imageDataUrl = `data:${mime};base64,${btoa(binary)}`;
		mode = 'image';
		await generate();
	}

	async function downloadZip() {
		if (!pngs.length || !icoBytes || !html) return;
		zipping = true;
		error = null;
		try {
			const blob = await buildFaviconZip({
				pngs,
				icoDataUrl,
				icoBytes,
				html
			});
			const href = URL.createObjectURL(blob);
			downloadText('favicons.zip', href, 'application/zip');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to build ZIP';
		} finally {
			zipping = false;
		}
	}

	function resetAll() {
		mode = DEFAULT_MODE;
		text = DEFAULT_TEXT;
		backgroundColor = DEFAULT_BG;
		textColor = DEFAULT_FG;
		rounded = DEFAULT_ROUNDED;
		imageDataUrl = '';
		imageName = '';
		selectedSize = 32;
		downloadTarget = 'png';
		error = null;
		void generate();
	}

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			let changed = false;
			if (next.mode !== mode) {
				mode = next.mode;
				changed = true;
			}
			if (next.text !== text) {
				text = next.text;
				changed = true;
			}
			if (next.backgroundColor !== backgroundColor) {
				backgroundColor = next.backgroundColor;
				changed = true;
			}
			if (next.textColor !== textColor) {
				textColor = next.textColor;
				changed = true;
			}
			if (next.rounded !== rounded) {
				rounded = next.rounded;
				changed = true;
			}
			if (changed) {
				error = null;
				if (mode === 'text' || imageDataUrl) void generate();
				else clearOutput();
			}
		});
	});

	$effect(() => {
		syncShareParams(
			{
				mode,
				text: normalizeInitials(text),
				backgroundColor: backgroundColor.replace(/^#/, ''),
				textColor: textColor.replace(/^#/, ''),
				rounded
			},
			shareKeys,
			{
				defaults: {
					mode: DEFAULT_MODE,
					text: DEFAULT_TEXT,
					backgroundColor: DEFAULT_BG.replace(/^#/, ''),
					textColor: DEFAULT_FG.replace(/^#/, ''),
					rounded: String(DEFAULT_ROUNDED)
				}
			}
		);
	});

	$effect(() => {
		setToolShellActions({
			downloadValue,
			downloadFilename,
			downloadMime: downloadTarget === 'ico' ? 'image/x-icon' : 'image/png',
			copyValue: html,
			onReset: resetAll
		});
	});

	void generate();
</script>

<div class="flex flex-col gap-6">
	<div class="grid gap-4 lg:grid-cols-2">
		<div class="flex flex-col gap-4">
			<Field id="fg-mode" label="Source">
				<select
					id="fg-mode"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					value={mode}
					onchange={(e) =>
						onModeChange(
							(e.currentTarget as HTMLSelectElement).value as FaviconGeneratorInput['mode']
						)}
				>
					<option value="text">Text / initials</option>
					<option value="image">Image / logo</option>
				</select>
			</Field>

			{#if mode === 'text'}
				<Field id="fg-text" label="Letters" hint="Exactly 1 or 2 characters">
					<Input
						id="fg-text"
						value={text}
						maxlength={2}
						class="font-mono text-sm uppercase"
						oninput={(e) => onTextInput((e.currentTarget as HTMLInputElement).value)}
					/>
				</Field>
				<div class="grid gap-4 sm:grid-cols-2">
					<Field id="fg-bg" label="Background">
						<div class="flex gap-2">
							<input
								type="color"
								class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
								bind:value={backgroundColor}
								oninput={() => void generate()}
								aria-label="Background color"
							/>
							<Input
								id="fg-bg"
								bind:value={backgroundColor}
								class="font-mono text-sm"
								oninput={() => void generate()}
							/>
						</div>
					</Field>
					<Field id="fg-fg" label="Text color">
						<div class="flex gap-2">
							<input
								type="color"
								class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
								bind:value={textColor}
								oninput={() => void generate()}
								aria-label="Text color"
							/>
							<Input
								id="fg-fg"
								bind:value={textColor}
								class="font-mono text-sm"
								oninput={() => void generate()}
							/>
						</div>
					</Field>
				</div>
			{:else}
				<div
					role="button"
					tabindex="0"
					class="cursor-pointer rounded-lg border border-dashed border-border bg-bg-elevated px-4 py-8 text-center"
					onclick={() => inputEl?.click()}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							inputEl?.click();
						}
					}}
				>
					<p class="font-medium text-fg">{imageName || 'Choose an image'}</p>
					<p class="mt-1 text-sm text-muted">PNG, JPEG, GIF, or WebP — up to 2 MB</p>
				</div>
				<input
					bind:this={inputEl}
					type="file"
					class="sr-only"
					accept={faviconGenerator.file!.accept}
					aria-label="Upload image for favicon"
					onchange={(e) => onFile((e.currentTarget as HTMLInputElement).files)}
				/>
				{#if !imageDataUrl}
					<p class="text-sm text-muted">Upload a square-ish logo for best results.</p>
				{/if}
			{/if}

			<label class="flex items-center gap-2 text-sm text-fg">
				<input
					type="checkbox"
					class="size-4 rounded border-border"
					bind:checked={rounded}
					onchange={() => {
						if (mode === 'text' || imageDataUrl) void generate();
					}}
				/>
				Rounded corners
			</label>

			{#if error}
				<Alert variant="danger" title="Error">{error}</Alert>
			{/if}
			{#if loading}
				<p class="text-sm text-muted">Generating…</p>
			{/if}
		</div>

		<div class="flex flex-col gap-4">
			<p class="text-sm font-medium text-fg">Preview</p>
			{#if pngs.length}
				<div class="grid grid-cols-3 gap-3 sm:grid-cols-3">
					{#each pngs as png (png.size)}
						<button
							type="button"
							class="flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors {selectedSize ===
								png.size && downloadTarget === 'png'
								? 'border-accent bg-bg-elevated'
								: 'border-border hover:border-accent/50'}"
							onclick={() => {
								selectedSize = png.size;
								downloadTarget = 'png';
							}}
							aria-label="Select {png.size}px PNG"
							aria-pressed={selectedSize === png.size && downloadTarget === 'png'}
						>
							<img
								src={png.dataUrl}
								alt="{png.size}px favicon"
								width="48"
								height="48"
								class="rounded-sm bg-bg [image-rendering:pixelated]"
							/>
							<span class="text-xs text-muted">{png.size}×{png.size}</span>
						</button>
					{/each}
				</div>

				<button
					type="button"
					class="rounded-xl border px-3 py-2 text-left text-sm transition-colors {downloadTarget ===
					'ico'
						? 'border-accent bg-bg-elevated'
						: 'border-border hover:border-accent/50'}"
					onclick={() => {
						downloadTarget = 'ico';
					}}
					aria-pressed={downloadTarget === 'ico'}
				>
					Download target: <strong class="font-medium text-fg">favicon.ico</strong>
					<span class="text-muted"> (16 + 32 + 48)</span>
				</button>

				<div class="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onclick={downloadZip}
						disabled={zipping}
					>
						{zipping ? 'Zipping…' : 'Download all (ZIP)'}
					</Button>
					<p class="text-sm text-muted">
						Action Bar downloads
						{#if downloadTarget === 'ico'}
							favicon.ico
						{:else}
							{downloadFilename}
						{/if}
						only.
					</p>
				</div>
			{:else if mode === 'image' && !imageDataUrl}
				<div
					class="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-bg p-6 text-center text-sm text-muted"
				>
					Upload an image to preview icons.
				</div>
			{:else}
				<div
					class="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border bg-bg p-6 text-sm text-muted"
				>
					Set source options to preview icons.
				</div>
			{/if}
		</div>
	</div>

	{#if html}
		<div class="flex flex-col gap-1.5">
			<div class="flex items-center justify-between gap-2">
				<p class="text-sm font-medium text-fg">HTML snippet</p>
				<CopyButton value={html} />
			</div>
			<pre
				class="overflow-x-auto rounded-xl border border-border bg-bg p-3 font-mono text-xs text-fg">{html}</pre>
		</div>
	{/if}
</div>
