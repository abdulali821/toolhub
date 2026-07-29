<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		readShareNumber,
		readShareParam,
		urlSearchParams
	} from '$engine/tool-share';
	import { xmlFormatter, run } from './index';

	const shareKeys = xmlFormatter.share!.params;
	const maxParamBytes = xmlFormatter.share!.maxParamBytes;
	const DEFAULT_XML = '<root><item id="1">Hello</item><item id="2"/></root>';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			xml: readShareParam(sp, 'xml') ?? DEFAULT_XML,
			indent: readShareNumber(sp, 'indent', 2)
		};
	}

	const initial = fromUrl();
	let xml = $state(initial.xml);
	let indent = $state(initial.indent);
	let result = $derived(run({ xml, indent: Number(indent) }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.xml !== xml) xml = next.xml;
			if (next.indent !== Number(indent)) indent = next.indent;
		});
	});

	$effect(() => {
		pushShareState({ xml, indent }, shareKeys, {
			maxParamBytes,
			defaults: { xml: DEFAULT_XML, indent: '2' }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result.valid ? result.formatted : '',
			downloadValue: result.valid ? result.formatted : '',
			downloadFilename: 'formatted.xml',
			downloadMime: 'application/xml;charset=utf-8',
			onReset: () => {
				xml = DEFAULT_XML;
				indent = 2;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="xml-input" label="XML input" required>
		<Textarea
			id="xml-input"
			bind:value={xml}
			rows={14}
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>

	<div class="flex flex-col gap-3">
		<div class="flex items-center justify-between gap-3">
			<label class="text-sm font-medium" for="indent">Indent</label>
			<select
				id="indent"
				class="h-10 rounded-md border border-border bg-bg px-3 text-sm"
				bind:value={indent}
			>
				<option value={0}>Compact</option>
				<option value={2}>2 spaces</option>
				<option value={4}>4 spaces</option>
			</select>
		</div>

		{#if !result.valid && result.error}
			<Alert variant="danger" title="Invalid XML">{result.error}</Alert>
		{:else}
			<Alert variant="success" title="Valid XML">Formatted successfully.</Alert>
		{/if}

		<Field id="xml-output" label="Output">
			<Textarea
				id="xml-output"
				value={result.formatted}
				rows={12}
				readonly
				class="font-mono text-sm"
			/>
		</Field>
	</div>
</div>
