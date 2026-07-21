<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { jsonCompare, run } from './index';

	const shareKeys = jsonCompare.share!.params;
	const maxParamBytes = jsonCompare.share!.maxParamBytes;
	const DEFAULT_LEFT = '{\n  "name": "Ada",\n  "role": "Engineer"\n}';
	const DEFAULT_RIGHT = '{\n  "name": "Ada",\n  "role": "Scientist",\n  "team": "Research"\n}';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			left: readShareParam(sp, 'left') ?? DEFAULT_LEFT,
			right: readShareParam(sp, 'right') ?? DEFAULT_RIGHT
		};
	}

	const initial = fromUrl();
	let left = $state(initial.left);
	let right = $state(initial.right);
	let result = $derived(run({ left, right }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.left !== left) left = next.left;
			if (next.right !== right) right = next.right;
		});
	});

	$effect(() => {
		pushShareState({ left, right }, shareKeys, {
			maxParamBytes,
			defaults: { left: DEFAULT_LEFT, right: DEFAULT_RIGHT }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result.summary,
			onReset: () => {
				left = DEFAULT_LEFT;
				right = DEFAULT_RIGHT;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="json-compare-left" label="Left JSON">
		<Textarea
			id="json-compare-left"
			bind:value={left}
			rows={12}
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>
	<Field id="json-compare-right" label="Right JSON">
		<Textarea
			id="json-compare-right"
			bind:value={right}
			rows={12}
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>
</div>

<div class="mt-4 flex flex-col gap-3">
	{#if !result.validLeft || !result.validRight}
		<Alert variant="danger" title="Parse error">
			{#if result.errorLeft}
				Left: {result.errorLeft}
			{/if}
			{#if result.errorRight}
				<span class={result.errorLeft ? 'mt-1 block' : ''}>Right: {result.errorRight}</span>
			{/if}
		</Alert>
	{:else if result.equal}
		<Alert variant="success" title="Identical">The JSON documents match.</Alert>
	{:else}
		<Alert variant="warning" title="Differences found">
			{result.counts.changed} changed, {result.counts.added} added, {result.counts.removed} removed
		</Alert>
	{/if}

	<Field id="json-compare-summary" label="Diff summary">
		<Textarea
			id="json-compare-summary"
			value={result.summary}
			rows={10}
			readonly
			class="font-mono text-sm"
		/>
	</Field>
</div>
