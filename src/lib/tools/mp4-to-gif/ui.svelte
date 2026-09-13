<script lang="ts">
	import { Alert, Button, Field } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { downloadText } from '$engine/share-state';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { mp4ToGif, run } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let outputBlobUrl = $state('');
	let fileName = $state('clip');
	let fps = $state(10);
	let maxWidth = $state(480);
	let processing = $state(false);
	let status = $state('');
	let progressRatio = $state(0);

	function revokeBlob() {
		if (outputBlobUrl.startsWith('blob:')) URL.revokeObjectURL(outputBlobUrl);
		outputBlobUrl = '';
	}

	function clearOutput() {
		outputDataUrl = '';
		revokeBlob();
	}

	async function processVideo() {
		if (!sourceDataUrl || processing) return;
		processing = true;
		error = null;
		status = 'Getting ready…';
		progressRatio = 0;
		clearOutput();
		try {
			const out = await run({
				dataUrl: sourceDataUrl,
				fps: Number(fps),
				maxWidth: Number(maxWidth),
				onProgress: (p) => {
					progressRatio = p.ratio;
					status =
						p.phase === 'loading'
							? 'First-time setup… this only happens once'
							: `Converting… ${Math.round(p.ratio * 100)}%`;
				}
			});
			outputDataUrl = out.dataUrl;
			outputBlobUrl = out.blobUrl;
			status = '';
		} catch (err) {
			clearOutput();
			error = err instanceof Error ? err.message : 'Failed to convert MP4';
			status = '';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.mp4$/i, '') || 'clip';
		sourceDataUrl = await readFileAsDataUrl(file);
		clearOutput();
		status = '';
		progressRatio = 0;
	}

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputBlobUrl || outputDataUrl,
			downloadFilename: `${fileName}.gif`,
			downloadMime: 'image/gif',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				clearOutput();
				fileName = 'clip';
				fps = 10;
				maxWidth = 480;
				status = '';
				progressRatio = 0;
			}
		});
	});
</script>

<div class="flex w-full max-w-5xl flex-col gap-8">
	<section class="flex flex-col gap-3">
		<div>
			<p class="text-sm font-medium text-fg">1. Upload MP4</p>
			<p class="text-sm text-muted">
				Pick a clip first — then set FPS and width before generating.
			</p>
		</div>
		<Dropzone
			constraints={mp4ToGif.file!}
			class="rounded-xl px-6 py-16"
			label="Drop an MP4 here or browse"
			hint="MP4 only · up to 20 MB · converts in your browser"
			{onselect}
			onerror={(message) => {
				error = message;
				sourceDataUrl = '';
				clearOutput();
			}}
		/>
	</section>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if sourceDataUrl}
		<section class="flex flex-col gap-4 rounded-xl border border-border bg-bg-elevated p-5 sm:p-6">
			<div>
				<p class="text-sm font-medium text-fg">2. Settings</p>
				<p class="text-sm text-muted">
					Tweak these, then hit Generate — nothing converts until you do.
				</p>
			</div>

			<div class="grid gap-6 sm:grid-cols-2">
				<Field id="m2g-fps" label="FPS — {fps}">
					<input
						id="m2g-fps"
						type="range"
						min="4"
						max="15"
						step="1"
						bind:value={fps}
						class="h-3 w-full accent-fg"
						disabled={processing}
						oninput={() => clearOutput()}
					/>
					<p class="mt-2 text-sm text-muted">Lower = smaller GIF. Higher = smoother.</p>
				</Field>
				<Field id="m2g-width" label="Max width — {maxWidth}px">
					<input
						id="m2g-width"
						type="range"
						min="160"
						max="720"
						step="40"
						bind:value={maxWidth}
						class="h-3 w-full accent-fg"
						disabled={processing}
						oninput={() => clearOutput()}
					/>
					<p class="mt-2 text-sm text-muted">Caps the long edge. Height follows aspect.</p>
				</Field>
			</div>

			<div class="overflow-hidden rounded-lg border border-border bg-bg">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					src={sourceDataUrl}
					controls
					class="mx-auto max-h-112 w-full bg-black object-contain"
					aria-label="MP4 source preview"
				></video>
			</div>

			<Button
				type="button"
				size="lg"
				class="w-full font-semibold sm:w-auto sm:min-w-56"
				disabled={processing}
				onclick={() => void processVideo()}
			>
				{processing ? 'Generating…' : '3. Generate GIF'}
			</Button>

			{#if processing}
				<div class="flex flex-col gap-2">
					<p class="text-sm text-muted">{status}</p>
					<div class="h-3 overflow-hidden rounded-full bg-border">
						<div
							class="h-full bg-fg transition-all"
							style={`width: ${Math.round(progressRatio * 100)}%`}
						></div>
					</div>
				</div>
			{/if}
		</section>
	{/if}

	{#if outputBlobUrl || outputDataUrl}
		<section class="flex flex-col gap-4">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p class="text-sm font-medium text-fg">GIF result</p>
					<p class="text-sm text-muted">Preview below, then download when it looks right.</p>
				</div>
				<Button
					type="button"
					size="lg"
					onclick={() =>
						downloadText(`${fileName}.gif`, outputBlobUrl || outputDataUrl, 'image/gif')}
				>
					Download GIF
				</Button>
			</div>
			<div class="overflow-hidden rounded-lg border border-border bg-bg p-3">
				<img
					src={outputBlobUrl || outputDataUrl}
					alt="GIF output"
					class="mx-auto max-h-112 w-full object-contain"
				/>
			</div>
		</section>
	{/if}
</div>
