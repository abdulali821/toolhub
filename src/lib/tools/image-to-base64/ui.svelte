<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readFileAsDataUrl } from '$lib/utils/file';
	import { imageToBase64, run } from './index';

	let error = $state<string | null>(null);
	let fileName = $state('image');
	let dataUrl = $state('');
	let output = $derived(dataUrl ? run({ dataUrl, fileName }) : null);

	async function onselect(file: File) {
		error = null;
		fileName = file.name;
		dataUrl = await readFileAsDataUrl(file);
	}

	$effect(() => {
		setToolShellActions({
			copyValue: dataUrl,
			downloadValue: dataUrl,
			downloadFilename: `${fileName}.data-uri.txt`,
			downloadMime: 'text/plain;charset=utf-8',
			onReset: () => {
				error = null;
				fileName = 'image';
				dataUrl = '';
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={imageToBase64.file!}
		hint="PNG, JPEG, GIF, WebP, or SVG up to 2 MB"
		{onselect}
		onerror={(message) => {
			error = message;
			dataUrl = '';
		}}
	/>

	{#if error}
		<Alert variant="danger" title="File rejected">{error}</Alert>
	{/if}

	{#if output}
		{#if dataUrl.startsWith('data:image')}
			<img
				src={dataUrl}
				alt="Preview of {fileName}"
				class="h-auto max-h-48 max-w-full self-start rounded-md border border-border object-contain"
			/>
		{/if}

		<Field id="img-dataurl" label="Data URI">
			<Textarea
				id="img-dataurl"
				value={output.dataUrl}
				rows={4}
				readonly
				class="font-mono text-xs"
			/>
		</Field>
		<CopyButton value={output.dataUrl} label="Copy Data URI" />

		<Field id="img-b64" label="Base64 only">
			<Textarea id="img-b64" value={output.base64} rows={4} readonly class="font-mono text-xs" />
		</Field>
		<CopyButton value={output.base64} label="Copy Base64" />

		<Field id="img-html" label="HTML snippet">
			<Textarea id="img-html" value={output.html} rows={2} readonly class="font-mono text-xs" />
		</Field>
		<CopyButton value={output.html} label="Copy HTML" />
	{/if}
</div>
