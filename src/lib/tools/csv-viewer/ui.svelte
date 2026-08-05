<script lang="ts">
	import { Alert, Field, Input, Textarea } from '$ui';
	import Dropzone from '$ui/tools/Dropzone.svelte';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { readFileAsText } from '$lib/utils/file';
	import { csvViewer, run, rowsToCsv, rowsToTsv, MAX_PREVIEW_ROWS } from './index';

	const shareKeys = csvViewer.share!.params;
	const DEFAULT_CSV = '';
	const DEFAULT_QUERY = '';

	function fromUrl() {
		const sp = urlSearchParams();
		return { query: readShareParam(sp, 'query') ?? DEFAULT_QUERY };
	}

	const initial = fromUrl();
	let csv = $state(DEFAULT_CSV);
	let query = $state(initial.query);
	let fileName = $state('');
	let error = $state<string | null>(null);

	let output = $derived(run({ csv, query }));
	let previewRows = $derived(output.filteredRows.slice(0, MAX_PREVIEW_ROWS));

	async function onselect(file: File) {
		error = null;
		csv = await readFileAsText(file);
		fileName = file.name;
	}

	function onerror(message: string) {
		error = message;
	}

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.query !== query) query = next.query;
		});
	});

	$effect(() => {
		pushShareState({ query }, shareKeys, { defaults: { query: DEFAULT_QUERY } });
	});

	$effect(() => {
		setToolShellActions({
			copyValue: rowsToCsv([output.headers, ...output.filteredRows]),
			downloadValue: rowsToCsv([output.headers, ...output.filteredRows]),
			downloadFilename: `${fileName.replace(/\.csv$/i, '') || 'filtered'}.csv`,
			downloadMime: 'text/csv;charset=utf-8',
			onReset: () => {
				csv = DEFAULT_CSV;
				query = DEFAULT_QUERY;
				fileName = '';
				error = null;
			}
		});
	});
</script>

<div class="flex flex-col gap-6">
	<div class="grid gap-4 lg:grid-cols-2">
		<Dropzone
			constraints={csvViewer.file!}
			label="Upload a .csv file"
			hint="CSV up to 2 MB"
			{onselect}
			{onerror}
		/>
		<Field id="csv-paste" label="Or paste CSV text">
			<Textarea
				id="csv-paste"
				bind:value={csv}
				rows={4}
				class="font-mono text-sm"
				spellcheck="false"
			/>
		</Field>
	</div>

	{#if error}
		<Alert variant="danger" title="Upload error">{error}</Alert>
	{/if}

	<div class="flex flex-wrap items-end gap-4">
		<Field id="csv-search" label="Search" hint="Matches any column, case-insensitive">
			<Input id="csv-search" bind:value={query} placeholder="Filter rows…" class="max-w-xs" />
		</Field>
		<p class="pb-2.5 text-sm text-muted">
			{output.columnCount} column{output.columnCount === 1 ? '' : 's'} &middot; {output.filteredCount}
			of {output.rowCount} row{output.rowCount === 1 ? '' : 's'}
		</p>
		<div class="ml-auto flex gap-2 pb-0.5">
			<CopyButton value={rowsToCsv([output.headers, ...output.filteredRows])} label="Copy CSV" />
			<CopyButton value={rowsToTsv([output.headers, ...output.filteredRows])} label="Copy TSV" />
		</div>
	</div>

	{#if output.truncated}
		<Alert variant="info">
			Showing the first {MAX_PREVIEW_ROWS} of {output.filteredCount} matching rows. Search to narrow the
			results.
		</Alert>
	{/if}

	{#if !output.headers.length}
		<div
			class="flex min-h-32 items-center justify-center rounded-md border border-dashed border-border bg-bg p-6 text-center text-sm text-muted"
		>
			Paste CSV text or upload a file to preview it as a table.
		</div>
	{:else}
		<div class="overflow-auto rounded-md border border-border">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-border bg-bg-elevated text-xs text-muted uppercase">
					<tr>
						{#each output.headers as header, i (i)}
							<th class="px-3 py-2 font-medium whitespace-nowrap">{header || `Column ${i + 1}`}</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each previewRows as row, rowIndex (rowIndex)}
						<tr>
							{#each row as cell, colIndex (colIndex)}
								<td class="px-3 py-2 whitespace-nowrap text-fg">{cell}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
