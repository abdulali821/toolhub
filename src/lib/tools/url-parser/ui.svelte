<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Alert, Field, Input, Textarea } from '$ui';
	import CopyButton from '$ui/tools/CopyButton.svelte';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import { urlParser, run } from './index';

	const shareKeys = urlParser.share!.params;
	const DEFAULT_URL = 'https://example.com/path?a=1&b=2#section';

	function fromUrl() {
		const sp = page.url.searchParams;
		return { url: readShareParam(sp, 'url') ?? DEFAULT_URL };
	}

	const initial = fromUrl();
	let url = $state(initial.url);
	let output = $derived(run({ url }));
	let queryJson = $derived(
		JSON.stringify(
			Object.fromEntries(
				Object.entries(
					output.query.reduce<Record<string, string[]>>((acc, { key, value }) => {
						(acc[key] ??= []).push(value);
						return acc;
					}, {})
				).map(([key, values]) => [key, values.length > 1 ? values : values[0]])
			),
			null,
			2
		)
	);

	$effect(() => {
		const next = fromUrl();
		untrack(() => {
			if (next.url !== url) url = next.url;
		});
	});

	$effect(() => {
		syncShareParams({ url }, shareKeys, { defaults: { url: DEFAULT_URL } });
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : queryJson,
			onReset: () => {
				url = DEFAULT_URL;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="up-url" label="URL" required hint="Include a scheme, e.g. https://">
		<Input id="up-url" bind:value={url} class="font-mono text-sm" autocomplete="off" />
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2">
			<Field id="up-protocol" label="Protocol">
				<Input id="up-protocol" value={output.protocol} readonly class="font-mono text-sm" />
			</Field>
			<Field id="up-hostname" label="Hostname">
				<Input id="up-hostname" value={output.hostname} readonly class="font-mono text-sm" />
			</Field>
			<Field id="up-username" label="Username">
				<Input id="up-username" value={output.username} readonly class="font-mono text-sm" />
			</Field>
			<Field id="up-password" label="Password">
				<Input id="up-password" value={output.password} readonly class="font-mono text-sm" />
			</Field>
			<Field id="up-port" label="Port">
				<Input id="up-port" value={output.port} readonly class="font-mono text-sm" />
			</Field>
			<Field id="up-hash" label="Hash">
				<Input id="up-hash" value={output.hash} readonly class="font-mono text-sm" />
			</Field>
		</div>

		<Field id="up-pathname" label="Pathname">
			<Input id="up-pathname" value={output.pathname} readonly class="font-mono text-sm" />
		</Field>

		<Field id="up-search" label="Query string">
			<Input id="up-search" value={output.search} readonly class="font-mono text-sm" />
		</Field>

		{#if output.query.length}
			<div>
				<p class="mb-2 text-sm font-medium text-fg">Query parameters</p>
				<div class="overflow-hidden rounded-md border border-border">
					<table class="w-full text-sm">
						<thead class="bg-bg-elevated text-left text-muted">
							<tr>
								<th class="px-3 py-2 font-medium">Key</th>
								<th class="px-3 py-2 font-medium">Value</th>
							</tr>
						</thead>
						<tbody>
							{#each output.query as entry, i (i)}
								<tr class="border-t border-border">
									<td class="px-3 py-2 font-mono">{entry.key}</td>
									<td class="px-3 py-2 font-mono break-all">{entry.value}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<Field id="up-json" label="Query as JSON">
			<Textarea id="up-json" value={queryJson} rows={6} readonly class="font-mono text-sm" />
		</Field>
		<div>
			<CopyButton value={queryJson} />
		</div>
	{/if}
</div>
