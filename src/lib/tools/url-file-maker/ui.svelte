<script lang="ts">
	import { Alert, Button, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { downloadText } from '$engine/share-state';
	import { buildUrlShortcutZip, urlFileMaker, run } from './index';

	const shareKeys = urlFileMaker.share!.params;
	const DEFAULT_URL = '';
	const DEFAULT_FILE_NAME = '';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			url: readShareParam(sp, 'url') ?? DEFAULT_URL,
			fileName: readShareParam(sp, 'fileName') ?? DEFAULT_FILE_NAME
		};
	}

	const initial = fromUrl();
	let url = $state(initial.url);
	let fileName = $state(initial.fileName);
	let zipping = $state(false);
	let zipError = $state<string | null>(null);

	let output = $derived(run({ url, fileName }));

	async function downloadZip() {
		if (output.error || zipping) return;
		zipping = true;
		zipError = null;
		try {
			const blob = await buildUrlShortcutZip(output.fileName, output.content);
			const href = URL.createObjectURL(blob);
			downloadText(output.zipFileName, href, 'application/zip');
		} catch (err) {
			zipError = err instanceof Error ? err.message : 'Failed to build ZIP';
		} finally {
			zipping = false;
		}
	}

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.url !== url) url = next.url;
			if (next.fileName !== fileName) fileName = next.fileName;
		});
	});

	$effect(() => {
		pushShareState({ url, fileName }, shareKeys, {
			defaults: { url: DEFAULT_URL, fileName: DEFAULT_FILE_NAME }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.content,
			onReset: () => {
				url = DEFAULT_URL;
				fileName = DEFAULT_FILE_NAME;
				zipError = null;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="ufm-url" label="Website URL" required hint="https:// is added if you omit a scheme">
		<Input
			id="ufm-url"
			type="url"
			bind:value={url}
			placeholder="https://example.com"
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>

	<Field
		id="ufm-name"
		label="File name"
		hint="Optional. Defaults to the site hostname. .url is added automatically."
	>
		<Input id="ufm-name" bind:value={fileName} placeholder="My shortcut" spellcheck="false" />
	</Field>

	{#if output.error}
		{#if url.trim()}
			<Alert variant="danger" title="Invalid URL">{output.error}</Alert>
		{:else}
			<p class="text-sm text-muted">Enter a URL to preview and download a Windows .url shortcut.</p>
		{/if}
	{:else}
		<Field id="ufm-preview" label="Shortcut contents ({output.fileName})">
			<Textarea
				id="ufm-preview"
				value={output.content}
				rows={4}
				readonly
				class="font-mono text-sm"
			/>
		</Field>

		<div class="flex flex-wrap items-center gap-3">
			<Button type="button" onclick={() => void downloadZip()} disabled={zipping}>
				{zipping ? 'Preparing…' : `Download ${output.zipFileName}`}
			</Button>
			<p class="text-sm text-muted">
				Extract the <code class="rounded bg-bg px-1">{output.fileName}</code> file, then double-click
				it on Windows.
			</p>
		</div>

		{#if zipError}
			<Alert variant="danger" title="Download error">{zipError}</Alert>
		{/if}

		<p class="text-sm text-muted">
			Browsers often block direct <code class="rounded bg-bg px-1">.url</code> downloads (and may
			save them as <code class="rounded bg-bg px-1">.download</code>). The ZIP avoids that.
		</p>
	{/if}
</div>
