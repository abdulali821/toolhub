<script lang="ts">
	import { Alert } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { imageMetadata, run } from './index';

	let error = $state<string | null>(null);
	let previewUrl = $state('');
	let fields = $state<{ key: string; value: string }[]>([]);

	async function onselect(file: File) {
		error = null;
		try {
			const buffer = await file.arrayBuffer();
			const bytes = new Uint8Array(buffer);
			const out = run({
				bytes: [...bytes],
				fileName: file.name,
				mimeType: file.type
			});
			fields = out.fields;
			previewUrl = URL.createObjectURL(file);
		} catch (err) {
			fields = [];
			previewUrl = '';
			error = err instanceof Error ? err.message : 'Failed to read image metadata';
		}
	}

	$effect(() => {
		setToolShellActions({
			onReset: () => {
				error = null;
				fields = [];
				if (previewUrl) URL.revokeObjectURL(previewUrl);
				previewUrl = '';
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Dropzone
		constraints={imageMetadata.file!}
		hint="PNG, JPEG, GIF, or WebP up to 2 MB"
		{onselect}
		onerror={(message) => {
			error = message;
			fields = [];
			if (previewUrl) URL.revokeObjectURL(previewUrl);
			previewUrl = '';
		}}
	/>

	{#if error}
		<Alert variant="danger" title="Error">{error}</Alert>
	{/if}

	{#if fields.length}
		{#if previewUrl}
			<img
				src={previewUrl}
				alt="Uploaded preview"
				class="max-h-48 w-auto rounded-md border border-border"
			/>
		{/if}

		<div class="overflow-x-auto rounded-md border border-border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-bg-elevated text-left">
						<th class="px-3 py-2 font-medium">Field</th>
						<th class="px-3 py-2 font-medium">Value</th>
					</tr>
				</thead>
				<tbody>
					{#each fields as field (field.key)}
						<tr class="border-b border-border last:border-b-0">
							<td class="px-3 py-2 text-muted">{field.key}</td>
							<td class="px-3 py-2 font-mono">{field.value}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
