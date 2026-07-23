<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Button, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareNumber, readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { qrCodeGenerator, run } from './index';

	const shareKeys = qrCodeGenerator.share!.params;
	const DEFAULT_TEXT = 'https://heytools.app';
	const DEFAULT_SIZE = 256;

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			size: readShareNumber(sp, 'size', DEFAULT_SIZE)
		};
	}

	const initial = optionsFromUrl();
	let text = $state(initial.text);
	let size = $state(initial.size);
	let dataUrl = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function generate(opts = { text, size: Number(size) }) {
		const safeSize = Math.min(1024, Math.max(64, Math.trunc(Number(opts.size) || DEFAULT_SIZE)));
		size = safeSize;
		if (!opts.text.trim()) {
			dataUrl = '';
			error = 'Enter text or a URL';
			return;
		}
		loading = true;
		error = null;
		try {
			const out = await run({ text: opts.text.trim(), size: safeSize });
			dataUrl = out.dataUrl;
		} catch (err) {
			dataUrl = '';
			error = err instanceof Error ? err.message : 'Failed to generate QR code';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			let changed = false;
			if (next.text !== text) {
				text = next.text;
				changed = true;
			}
			if (next.size !== Number(size)) {
				size = next.size;
				changed = true;
			}
			if (changed) void generate({ text: next.text, size: next.size });
		});
	});

	$effect(() => {
		syncShareParams({ text, size }, shareKeys, {
			defaults: { text: DEFAULT_TEXT, size: String(DEFAULT_SIZE) }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: dataUrl,
			downloadValue: dataUrl,
			downloadFilename: 'qrcode.png',
			downloadMime: 'image/png',
			onReset: () => {
				text = DEFAULT_TEXT;
				size = DEFAULT_SIZE;
				void generate({ text: DEFAULT_TEXT, size: DEFAULT_SIZE });
			}
		});
	});

	void generate(initial);
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="qr-text" label="Text or URL" required>
		<Textarea id="qr-text" bind:value={text} rows={4} />
	</Field>

	<Field id="qr-size" label="Size (px)" hint="64–1024">
		<Input id="qr-size" type="number" min="64" max="1024" bind:value={size} />
	</Field>

	<Button type="button" onclick={() => generate()} disabled={loading}>
		{loading ? 'Generating…' : 'Generate QR code'}
	</Button>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if dataUrl}
		<div class="flex flex-col items-start gap-3">
			<img
				src={dataUrl}
				alt="Generated QR code"
				class="max-w-full rounded-md border border-border"
			/>
		</div>
	{/if}
</div>
