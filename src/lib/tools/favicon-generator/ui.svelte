<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Button, Dropzone, Field, Input } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareBool, readShareParam, downloadText } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import {
		DISPLAY_MODES,
		FAVICON_FILE_CONSTRAINTS,
		assetFilename,
		buildFaviconZip,
		faviconGenerator,
		isSvgDataUrl,
		normalizeInitials,
		renderIcon,
		run,
		type DisplayMode,
		type FaviconGeneratorInput,
		type FaviconGeneratorOutput,
		type FaviconPng,
		type RenderSource
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
	let textColor = $state(initial.textColor);
	let rounded = $state(initial.rounded);
	let imageDataUrl = $state('');
	let imageName = $state('');

	let appName = $state('App');
	let shortName = $state('App');
	let description = $state('');
	let startUrl = $state('/');
	let assetPath = $state('/');
	let display = $state<DisplayMode>('standalone');
	let themeColor = $state('#ffffff');
	let darkThemeColor = $state('#000000');
	let useDarkTheme = $state(true);
	let manifestBg = $state('#ffffff');

	let desktopAddBg = $state(initial.mode === 'text');
	let desktopBg = $state(initial.backgroundColor);
	let desktopMargin = $state(0);
	let includeSvg = $state(true);

	let iosBg = $state('#ffffff');
	let iosMargin = $state(0);

	let pwaAddBg = $state(initial.mode === 'text');
	let pwaBg = $state(initial.backgroundColor);
	let pwaMargin = $state(0);
	let includeMaskable = $state(true);
	let maskableBg = $state('#ffffff');
	let maskableMargin = $state(40);

	let pngs = $state<FaviconPng[]>([]);
	let icoDataUrl = $state('');
	let html = $state('');
	let manifest = $state('');
	let selectedId = $state('favicon-32');
	let error = $state<string | null>(null);
	let loading = $state(false);
	let zipping = $state(false);
	let previewReady = $state(false);

	let previewDesktop = $state('');
	let previewIos = $state('');
	let previewPwa = $state('');
	let previewMaskable = $state('');

	const sourceReady = $derived(
		mode === 'text' ? Boolean(normalizeInitials(text)) : Boolean(imageDataUrl)
	);
	const isSvgSource = $derived(mode === 'image' && isSvgDataUrl(imageDataUrl));
	const selectedPng = $derived(pngs.find((p) => p.id === selectedId) ?? pngs[0] ?? null);
	const downloadValue = $derived(selectedPng?.dataUrl || icoDataUrl);
	const downloadFilename = $derived(
		selectedPng ? assetFilename(selectedPng.id) : icoDataUrl ? 'favicon.ico' : 'favicon.png'
	);

	function buildSource(): RenderSource | null {
		if (mode === 'image') {
			if (!imageDataUrl) return null;
			return { kind: 'image', dataUrl: imageDataUrl };
		}
		const label = normalizeInitials(text);
		if (!label) return null;
		return { kind: 'text', text: label, textColor, rounded };
	}

	function buildInput(): FaviconGeneratorInput {
		return {
			mode,
			imageDataUrl: mode === 'image' ? imageDataUrl : undefined,
			text: mode === 'text' ? normalizeInitials(text) : undefined,
			textColor,
			rounded,
			backgroundColor: desktopBg,
			desktop: {
				marginPercent: desktopMargin,
				addBackground: desktopAddBg,
				backgroundColor: desktopBg,
				includeSvg
			},
			ios: {
				marginPercent: iosMargin,
				backgroundColor: iosBg
			},
			pwa: {
				marginPercent: pwaMargin,
				addBackground: pwaAddBg,
				backgroundColor: pwaBg,
				includeMaskable,
				maskableBackgroundColor: maskableBg,
				maskableMarginPercent: maskableMargin
			},
			site: {
				appName,
				shortName,
				description,
				startUrl,
				assetPath,
				display,
				themeColor,
				darkThemeColor,
				useDarkTheme,
				backgroundColor: manifestBg
			}
		};
	}

	function clearOutput() {
		pngs = [];
		icoDataUrl = '';
		html = '';
		manifest = '';
	}

	function applyOutput(out: FaviconGeneratorOutput) {
		pngs = out.pngs;
		icoDataUrl = out.icoDataUrl;
		html = out.html;
		manifest = out.manifest;
		if (!pngs.some((p) => p.id === selectedId)) {
			selectedId = pngs[0]?.id ?? 'favicon-32';
		}
	}

	async function refreshPreviews() {
		const source = buildSource();
		if (!source) {
			previewDesktop = '';
			previewIos = '';
			previewPwa = '';
			previewMaskable = '';
			previewReady = false;
			return;
		}
		try {
			const [d, i, p, m] = await Promise.all([
				renderIcon(64, source, {
					marginPercent: desktopMargin,
					addBackground: desktopAddBg,
					backgroundColor: desktopBg,
					rounded
				}),
				renderIcon(120, source, {
					marginPercent: iosMargin,
					addBackground: true,
					backgroundColor: iosBg,
					forceOpaque: true,
					rounded: false
				}),
				renderIcon(96, source, {
					marginPercent: pwaMargin,
					addBackground: pwaAddBg,
					backgroundColor: pwaBg,
					rounded
				}),
				renderIcon(96, source, {
					marginPercent: maskableMargin,
					addBackground: true,
					backgroundColor: maskableBg,
					forceOpaque: true,
					rounded: false
				})
			]);
			previewDesktop = d.dataUrl;
			previewIos = i.dataUrl;
			previewPwa = p.dataUrl;
			previewMaskable = m.dataUrl;
			previewReady = true;
		} catch {
			previewReady = false;
		}
	}

	async function generate() {
		if (!sourceReady) {
			clearOutput();
			error = null;
			return;
		}
		loading = true;
		error = null;
		try {
			const out = await run(buildInput());
			applyOutput(out);
		} catch (err) {
			clearOutput();
			error = err instanceof Error ? err.message : 'Failed to generate favicon';
		} finally {
			loading = false;
		}
	}

	async function onFile(file: File) {
		error = null;
		imageName = file.name;
		imageDataUrl = await readFileAsDataUrl(file);
		mode = 'image';
		desktopAddBg = false;
		pwaAddBg = false;
		await refreshPreviews();
		await generate();
	}

	async function downloadZip() {
		if (!sourceReady) return;
		zipping = true;
		error = null;
		try {
			// Always rebuild so site path / theme / margins match current controls.
			const out = await run(buildInput());
			applyOutput(out);
			const blob = await buildFaviconZip(out);
			const href = URL.createObjectURL(blob);
			downloadText('favicon-assets.zip', href, 'application/zip');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to build ZIP';
		} finally {
			zipping = false;
		}
	}

	function resetAll() {
		mode = DEFAULT_MODE;
		text = DEFAULT_TEXT;
		textColor = DEFAULT_FG;
		rounded = DEFAULT_ROUNDED;
		imageDataUrl = '';
		imageName = '';
		appName = 'App';
		shortName = 'App';
		description = '';
		startUrl = '/';
		assetPath = '/';
		display = 'standalone';
		themeColor = '#ffffff';
		darkThemeColor = '#000000';
		useDarkTheme = true;
		manifestBg = '#ffffff';
		desktopAddBg = true;
		desktopBg = DEFAULT_BG;
		desktopMargin = 0;
		includeSvg = true;
		iosBg = '#ffffff';
		iosMargin = 0;
		pwaAddBg = true;
		pwaBg = DEFAULT_BG;
		pwaMargin = 0;
		includeMaskable = true;
		maskableBg = '#ffffff';
		maskableMargin = 40;
		selectedId = 'favicon-32';
		error = null;
		void refreshPreviews();
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
			if (next.backgroundColor !== desktopBg) {
				desktopBg = next.backgroundColor;
				pwaBg = next.backgroundColor;
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
				void refreshPreviews();
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
				backgroundColor: desktopBg.replace(/^#/, ''),
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
			downloadMime: selectedPng ? 'image/png' : 'image/x-icon',
			copyValue: html,
			onReset: resetAll
		});
	});

	// Live platform previews whenever source / paint options change.
	$effect(() => {
		void mode;
		void text;
		void textColor;
		void rounded;
		void imageDataUrl;
		void desktopAddBg;
		void desktopBg;
		void desktopMargin;
		void iosBg;
		void iosMargin;
		void pwaAddBg;
		void pwaBg;
		void pwaMargin;
		void maskableBg;
		void maskableMargin;
		void includeMaskable;
		void refreshPreviews();
	});

	void refreshPreviews();
	void generate();
</script>

{#snippet toggle(
	id: string,
	label: string,
	hint: string,
	checked: boolean,
	onChange: (v: boolean) => void
)}
	<div class="flex items-start justify-between gap-4 py-2">
		<div class="min-w-0">
			<label for={id} class="block text-sm font-medium text-fg">{label}</label>
			{#if hint}
				<p class="mt-0.5 text-sm text-muted">{hint}</p>
			{/if}
		</div>
		<button
			{id}
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			class="relative h-6 w-11 shrink-0 rounded-full transition-colors {checked
				? 'bg-fg'
				: 'bg-border'}"
			onclick={() => onChange(!checked)}
		>
			<span
				class="absolute top-0.5 left-0.5 size-5 rounded-full bg-bg transition-transform {checked
					? 'translate-x-5'
					: 'translate-x-0'}"
			></span>
		</button>
	</div>
{/snippet}

{#snippet colorField(
	id: string,
	label: string,
	hint: string,
	value: string,
	onChange: (v: string) => void
)}
	<Field {id} {label} {hint}>
		<div class="flex gap-2">
			<input
				type="color"
				class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
				{value}
				oninput={(e) => onChange((e.currentTarget as HTMLInputElement).value)}
				aria-label={label}
			/>
			<Input
				{id}
				{value}
				class="font-mono text-sm"
				oninput={(e) => onChange((e.currentTarget as HTMLInputElement).value)}
			/>
		</div>
	</Field>
{/snippet}

{#snippet marginSlider(id: string, label: string, value: number, onChange: (v: number) => void)}
	<Field {id} label="{label} ({Math.round(value)}%)">
		<input
			{id}
			type="range"
			min="0"
			max="45"
			step="1"
			{value}
			oninput={(e) => onChange(Number((e.currentTarget as HTMLInputElement).value))}
			class="w-full accent-fg"
		/>
		<p class="mt-1 text-sm text-muted">Visual breathing room around the source inside the icon.</p>
	</Field>
{/snippet}

<div class="flex flex-col gap-6">
	<!-- Source -->
	<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
		<div class="mb-4">
			<h2 class="text-base font-semibold text-fg">Source image</h2>
			<p class="mt-1 text-sm text-muted">
				Every platform uses this unless you switch to initials. PNG, JPEG, WebP, GIF, or SVG.
			</p>
		</div>

		<div class="mb-4 flex flex-wrap gap-2">
			<button
				type="button"
				class="rounded-full border px-3 py-1.5 text-sm transition-colors {mode === 'image'
					? 'border-fg bg-fg text-bg'
					: 'border-border text-fg hover:border-fg/40'}"
				onclick={() => {
					mode = 'image';
					void refreshPreviews();
					if (imageDataUrl) void generate();
					else clearOutput();
				}}
			>
				Image / logo
			</button>
			<button
				type="button"
				class="rounded-full border px-3 py-1.5 text-sm transition-colors {mode === 'text'
					? 'border-fg bg-fg text-bg'
					: 'border-border text-fg hover:border-fg/40'}"
				onclick={() => {
					mode = 'text';
					desktopAddBg = true;
					pwaAddBg = true;
					void refreshPreviews();
					void generate();
				}}
			>
				Text / initials
			</button>
		</div>

		{#if mode === 'image'}
			<Dropzone
				constraints={FAVICON_FILE_CONSTRAINTS}
				label={imageName || 'Choose an image'}
				hint="PNG, JPEG, WebP, GIF, or SVG — up to 2 MB"
				onselect={(file) => void onFile(file)}
				onerror={(message) => (error = message)}
			/>
			{#if imageDataUrl}
				<div class="mt-3 flex items-center gap-3">
					<img
						src={imageDataUrl}
						alt="Source"
						class="size-12 rounded-lg border border-border bg-bg object-contain"
					/>
					<p class="text-sm text-muted">{imageName}</p>
				</div>
			{/if}
		{:else}
			<div class="grid gap-4 sm:grid-cols-3">
				<Field id="fg-text" label="Letters" hint="1–2 characters">
					<Input
						id="fg-text"
						value={text}
						maxlength={2}
						class="font-mono text-sm uppercase"
						oninput={(e) => {
							text = normalizeInitials((e.currentTarget as HTMLInputElement).value);
							void refreshPreviews();
							void generate();
						}}
					/>
				</Field>
				{@render colorField('fg-desktop-bg-text', 'Background', '', desktopBg, (v) => {
					desktopBg = v;
					pwaBg = v;
					void refreshPreviews();
					void generate();
				})}
				{@render colorField('fg-fg', 'Text color', '', textColor, (v) => {
					textColor = v;
					void refreshPreviews();
					void generate();
				})}
			</div>
			{@render toggle('fg-rounded', 'Rounded corners', 'Softens text-mode icons.', rounded, (v) => {
				rounded = v;
				void refreshPreviews();
				void generate();
			})}
		{/if}
	</section>

	<!-- Site info -->
	<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
		<div class="mb-4">
			<h2 class="text-base font-semibold text-fg">Site info</h2>
			<p class="mt-1 text-sm text-muted">
				Used by the web manifest, Apple touch label, and HTML snippet.
			</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="fg-app" label="App name">
				<Input id="fg-app" bind:value={appName} />
			</Field>
			<Field id="fg-short" label="Short name" hint="When the full name is too long.">
				<Input id="fg-short" bind:value={shortName} />
			</Field>
			<Field
				id="fg-desc"
				label="Description"
				hint="Optional — omitted from the manifest when blank."
			>
				<Input id="fg-desc" bind:value={description} />
			</Field>
			<Field id="fg-start" label="Start URL" hint="Where the installed PWA opens.">
				<Input id="fg-start" bind:value={startUrl} class="font-mono text-sm" />
			</Field>
			<Field
				id="fg-path"
				label="Asset path"
				hint="Prefix for every href in the HTML snippet and manifest icons."
			>
				<Input id="fg-path" bind:value={assetPath} class="font-mono text-sm" />
			</Field>
			<Field id="fg-display" label="Display mode">
				<select
					id="fg-display"
					class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm"
					bind:value={display}
				>
					{#each DISPLAY_MODES as d (d)}
						<option value={d}>{d}</option>
					{/each}
				</select>
			</Field>
			{@render colorField(
				'fg-theme',
				'Theme color',
				'Manifest theme_color and meta theme-color.',
				themeColor,
				(v) => (themeColor = v)
			)}
			{@render colorField(
				'fg-manifest-bg',
				'Background color',
				'Manifest background_color for splash screens.',
				manifestBg,
				(v) => (manifestBg = v)
			)}
		</div>
		{@render toggle(
			'fg-dark-theme',
			'Add a dark theme color',
			'Emits a second theme-color meta for prefers-color-scheme: dark.',
			useDarkTheme,
			(v) => (useDarkTheme = v)
		)}
		{#if useDarkTheme}
			<div class="mt-2 max-w-sm">
				{@render colorField(
					'fg-dark',
					'Dark theme color',
					'',
					darkThemeColor,
					(v) => (darkThemeColor = v)
				)}
			</div>
		{/if}
	</section>

	<!-- Desktop -->
	<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
		<div class="mb-4">
			<h2 class="text-base font-semibold text-fg">Desktop browser favicon</h2>
			<p class="mt-1 text-sm text-muted">
				Controls favicon.ico, favicon-16×16.png, favicon-32×32.png
				{#if isSvgSource && includeSvg}, and favicon.svg{/if}.
			</p>
		</div>
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="flex flex-col gap-3">
				{#if isSvgSource}
					{@render toggle(
						'fg-svg',
						'Use original SVG',
						'Include the original file as favicon.svg alongside rasterized variants.',
						includeSvg,
						(v) => (includeSvg = v)
					)}
				{/if}
				{@render toggle('fg-desk-bg', 'Add background', '', desktopAddBg, (v) => {
					desktopAddBg = v;
					void refreshPreviews();
				})}
				{#if desktopAddBg}
					{@render colorField('fg-desk-color', 'Background color', '', desktopBg, (v) => {
						desktopBg = v;
						void refreshPreviews();
					})}
				{/if}
				{@render marginSlider('fg-desk-margin', 'Margin', desktopMargin, (v) => {
					desktopMargin = v;
					void refreshPreviews();
				})}
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				<div>
					<p class="mb-2 text-xs font-medium text-muted">Desktop browser tab</p>
					<div
						class="flex items-center gap-2 rounded-t-xl border border-border bg-white px-3 py-2 text-sm text-neutral-800"
					>
						{#if previewDesktop}
							<img src={previewDesktop} alt="" class="size-4 rounded-sm" />
						{:else}
							<span class="size-4 rounded-sm bg-neutral-200"></span>
						{/if}
						<span class="truncate font-medium">{appName || 'App'}</span>
						<span class="ml-auto text-neutral-400">×</span>
					</div>
				</div>
				<div>
					<p class="mb-2 text-xs font-medium text-muted">Desktop browser tab (dark)</p>
					<div
						class="flex items-center gap-2 rounded-t-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
					>
						{#if previewDesktop}
							<img src={previewDesktop} alt="" class="size-4 rounded-sm" />
						{:else}
							<span class="size-4 rounded-sm bg-neutral-600"></span>
						{/if}
						<span class="truncate font-medium">{appName || 'App'}</span>
						<span class="ml-auto text-neutral-500">×</span>
					</div>
				</div>
				<div class="sm:col-span-2">
					<p class="mb-2 text-xs font-medium text-muted">Search engine result</p>
					<div class="rounded-xl border border-border bg-white p-4 text-sm text-neutral-800">
						<div class="flex items-center gap-2">
							{#if previewDesktop}
								<img src={previewDesktop} alt="" class="size-5 rounded-full" />
							{:else}
								<span class="size-5 rounded-full bg-neutral-200"></span>
							{/if}
							<span class="text-xs text-neutral-500">{appName || 'App'} · example.com</span>
						</div>
						<p class="mt-1 text-base text-blue-700">{appName || 'App'} — site title</p>
						<p class="mt-0.5 text-xs text-neutral-500">
							Search snippet preview powered by your favicon.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- iOS -->
	<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
		<div class="mb-4">
			<h2 class="text-base font-semibold text-fg">iOS web clip</h2>
			<p class="mt-1 text-sm text-muted">
				Controls the 180×180 apple-touch-icon.png used on iOS home screens.
			</p>
		</div>
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="flex flex-col gap-3">
				{@render colorField(
					'fg-ios-bg',
					'Background color',
					'Apple icons must be opaque, so this fill is always applied.',
					iosBg,
					(v) => {
						iosBg = v;
						void refreshPreviews();
					}
				)}
				{@render marginSlider('fg-ios-margin', 'Margin', iosMargin, (v) => {
					iosMargin = v;
					void refreshPreviews();
				})}
			</div>
			<div>
				<p class="mb-2 text-xs font-medium text-muted">iOS home screen</p>
				<div
					class="rounded-2xl border border-border p-4"
					style="background: linear-gradient(145deg, #ff8a4c 0%, #c44dff 55%, #4c7fff 100%);"
				>
					<div class="mx-auto grid max-w-55 grid-cols-4 gap-3">
						{#each Array.from({ length: 7 }, (_, i) => i) as i (i)}
							<div class="aspect-square rounded-[22%] bg-white/35 shadow-sm"></div>
						{/each}
						<div class="flex flex-col items-center gap-1">
							<div class="aspect-square w-full overflow-hidden rounded-[22%] bg-white shadow-md">
								{#if previewIos}
									<img src={previewIos} alt="iOS icon" class="size-full object-cover" />
								{/if}
							</div>
							<span class="truncate text-[10px] text-white drop-shadow">{shortName || 'App'}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- PWA -->
	<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
		<div class="mb-4">
			<h2 class="text-base font-semibold text-fg">PWA icons</h2>
			<p class="mt-1 text-sm text-muted">
				Controls pwa-192×192.png, pwa-512×512.png, and optional maskable variants.
			</p>
		</div>
		<div class="grid gap-6 lg:grid-cols-2">
			<div class="flex flex-col gap-3">
				{@render toggle('fg-pwa-bg', 'Add background', '', pwaAddBg, (v) => {
					pwaAddBg = v;
					void refreshPreviews();
				})}
				{#if pwaAddBg}
					{@render colorField('fg-pwa-color', 'Background color', '', pwaBg, (v) => {
						pwaBg = v;
						void refreshPreviews();
					})}
				{/if}
				{@render marginSlider('fg-pwa-margin', 'Margin', pwaMargin, (v) => {
					pwaMargin = v;
					void refreshPreviews();
				})}
				{@render toggle(
					'fg-maskable',
					'Include maskable variants',
					'Adds maskable 192/512 PNGs and lists them with purpose: maskable in the manifest.',
					includeMaskable,
					(v) => {
						includeMaskable = v;
						void refreshPreviews();
					}
				)}
				{#if includeMaskable}
					{@render colorField('fg-mask-bg', 'Maskable background color', '', maskableBg, (v) => {
						maskableBg = v;
						void refreshPreviews();
					})}
					{@render marginSlider(
						'fg-mask-margin',
						'Maskable safe-zone margin',
						maskableMargin,
						(v) => {
							maskableMargin = v;
							void refreshPreviews();
						}
					)}
					<p class="text-sm text-muted">
						The W3C-recommended safe area is 40%. Source content stays visible inside platform
						masks.
					</p>
				{/if}
			</div>
			<div class="flex flex-col gap-4">
				<div>
					<p class="mb-2 text-xs font-medium text-muted">Windows taskbar</p>
					<div
						class="flex items-center justify-center gap-3 rounded-xl border border-border bg-neutral-200/80 px-4 py-3"
					>
						<span class="size-5 rounded bg-sky-500/80"></span>
						<span class="size-5 rounded bg-neutral-400/70"></span>
						{#if previewPwa}
							<img src={previewPwa} alt="" class="size-5 rounded" />
						{:else}
							<span class="size-5 rounded bg-white"></span>
						{/if}
						<span class="size-5 rounded bg-neutral-400/70"></span>
					</div>
				</div>
				<div>
					<p class="mb-2 text-xs font-medium text-muted">Android launcher</p>
					<div
						class="flex items-center justify-center gap-3 rounded-xl border border-border bg-[#1a237e] px-4 py-4"
					>
						<span class="size-9 rounded-full bg-emerald-400/80"></span>
						<span class="size-9 rounded-full bg-sky-400/80"></span>
						{#if includeMaskable && previewMaskable}
							<img src={previewMaskable} alt="" class="size-9 rounded-full object-cover" />
						{:else if previewPwa}
							<img src={previewPwa} alt="" class="size-9 rounded-full object-cover" />
						{:else}
							<span class="size-9 rounded-full bg-white"></span>
						{/if}
						<span class="size-9 rounded-full bg-amber-400/80"></span>
						<span class="size-9 rounded-full bg-rose-400/70"></span>
					</div>
				</div>
			</div>
		</div>
	</section>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	<!-- Actions -->
	<section class="flex flex-wrap items-center gap-3">
		<Button
			type="button"
			variant="primary"
			onclick={() => void generate()}
			disabled={!sourceReady || loading}
		>
			{loading ? 'Generating…' : 'Generate favicon assets'}
		</Button>
		<Button
			type="button"
			variant="secondary"
			onclick={() => void downloadZip()}
			disabled={!sourceReady || zipping || loading}
		>
			{zipping ? 'Zipping…' : 'Download ZIP'}
		</Button>
		<Button type="button" variant="ghost" onclick={resetAll}>Reset options</Button>
		{#if !sourceReady}
			<p class="text-sm text-muted">Upload an image or enter initials to continue.</p>
		{:else if previewReady && !pngs.length && !loading}
			<p class="text-sm text-muted">Previews are live — generate to build the full ZIP.</p>
		{/if}
	</section>

	{#if pngs.length}
		<section class="rounded-2xl border border-border bg-bg-elevated/40 p-5">
			<h2 class="mb-3 text-base font-semibold text-fg">Exported files</h2>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
				{#each pngs as png (png.id)}
					<button
						type="button"
						class="flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors {selectedId ===
						png.id
							? 'border-fg bg-bg'
							: 'border-border hover:border-fg/40'}"
						onclick={() => (selectedId = png.id)}
						aria-pressed={selectedId === png.id}
					>
						<img
							src={png.dataUrl}
							alt={assetFilename(png.id)}
							class="size-12 rounded-md bg-bg object-contain"
						/>
						<span class="text-center text-xs text-muted">{assetFilename(png.id)}</span>
					</button>
				{/each}
			</div>
			<p class="mt-3 text-sm text-muted">
				Action Bar downloads the selected PNG. Use Download ZIP for the full bundle + manifest.
			</p>
		</section>
	{/if}

	{#if html}
		<section class="flex flex-col gap-4">
			<div class="flex flex-col gap-1.5">
				<div class="flex items-center justify-between gap-2">
					<p class="text-sm font-medium text-fg">HTML snippet</p>
					<CopyButton value={html} />
				</div>
				<pre
					class="overflow-x-auto rounded-xl border border-border bg-bg p-3 font-mono text-xs text-fg">{html}</pre>
			</div>
			{#if manifest}
				<div class="flex flex-col gap-1.5">
					<div class="flex items-center justify-between gap-2">
						<p class="text-sm font-medium text-fg">site.webmanifest</p>
						<CopyButton value={manifest} />
					</div>
					<pre
						class="overflow-x-auto rounded-xl border border-border bg-bg p-3 font-mono text-xs text-fg">{manifest}</pre>
				</div>
			{/if}
		</section>
	{/if}
</div>
