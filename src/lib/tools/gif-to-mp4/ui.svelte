<script lang="ts">
	import { Alert, Button } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { downloadText } from '$engine/share-state';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { gifToMp4, run } from './index';

	let error = $state<string | null>(null);
	let sourceDataUrl = $state('');
	let outputDataUrl = $state('');
	let outputBlobUrl = $state('');
	let fileName = $state('animation');
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

	async function processGif() {
		if (!sourceDataUrl || processing) return;
		processing = true;
		error = null;
		status = 'Getting ready…';
		progressRatio = 0;
		clearOutput();
		try {
			const out = await run({
				dataUrl: sourceDataUrl,
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
			error = err instanceof Error ? err.message : 'Failed to convert GIF';
			status = '';
		} finally {
			processing = false;
		}
	}

	async function onselect(file: File) {
		error = null;
		fileName = file.name.replace(/\.gif$/i, '') || 'animation';
		sourceDataUrl = await readFileAsDataUrl(file);
		clearOutput();
		status = '';
		progressRatio = 0;
	}

	$effect(() => {
		setToolShellActions({
			copyValue: outputDataUrl,
			downloadValue: outputBlobUrl || outputDataUrl,
			downloadFilename: `${fileName}.mp4`,
			downloadMime: 'video/mp4',
			onReset: () => {
				error = null;
				sourceDataUrl = '';
				clearOutput();
				fileName = 'animation';
				status = '';
				progressRatio = 0;
			}
		});
	});
</script>

<div class="flex w-full max-w-5xl flex-col gap-8">
	<section class="flex flex-col gap-3">
		<div>
			<p class="text-sm font-medium text-fg">1. Upload GIF</p>
			<p class="text-sm text-muted">Load the animation, preview it, then generate when ready.</p>
		</div>
		<Dropzone
			constraints={gifToMp4.file!}
			class="rounded-xl px-6 py-16"
			label="Drop a GIF here or browse"
			hint="GIF only · up to 12 MB · converts in your browser"
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
				<p class="text-sm font-medium text-fg">2. Preview & generate</p>
				<p class="text-sm text-muted">Nothing converts until you click Generate.</p>
			</div>

			<div class="overflow-hidden rounded-lg border border-border bg-bg p-4">
				<img src={sourceDataUrl} alt="GIF source" class="mx-auto max-h-112 w-full object-contain" />
			</div>

			<Button
				type="button"
				size="lg"
				class="w-full font-semibold sm:w-auto sm:min-w-56"
				disabled={processing}
				onclick={() => void processGif()}
			>
				{processing ? 'Generating…' : '3. Generate MP4'}
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
					<p class="text-sm font-medium text-fg">MP4 result</p>
					<p class="text-sm text-muted">Preview below, then download when it looks right.</p>
				</div>
				<Button
					type="button"
					size="lg"
					onclick={() =>
						downloadText(`${fileName}.mp4`, outputBlobUrl || outputDataUrl, 'video/mp4')}
				>
					Download MP4
				</Button>
			</div>
			<div class="overflow-hidden rounded-lg border border-border bg-bg">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					src={outputBlobUrl || outputDataUrl}
					controls
					loop
					class="mx-auto max-h-112 w-full bg-black object-contain"
					aria-label="MP4 output preview"
				></video>
			</div>
		</section>
	{/if}
</div>
