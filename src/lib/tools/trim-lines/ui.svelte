<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { trimLines, run, type TrimLinesInput } from './index';

	const shareKeys = trimLines.share!.params;
	const maxParamBytes = trimLines.share!.maxParamBytes;
	const DEFAULT_TEXT = '  alpha  \n\tbeta\t\n  gamma';
	const DEFAULT_SIDE: TrimLinesInput['side'] = 'both';
	const SIDES = new Set<TrimLinesInput['side']>(['both', 'start', 'end']);

	function fromUrl() {
		const sp = urlSearchParams();
		const sideRaw = readShareParam(sp, 'side');
		const side =
			sideRaw && SIDES.has(sideRaw as TrimLinesInput['side'])
				? (sideRaw as TrimLinesInput['side'])
				: DEFAULT_SIDE;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			side
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let side = $state<TrimLinesInput['side']>(initial.side);
	let result = $derived(run({ text, side }).result);

	const sides: { value: TrimLinesInput['side']; label: string }[] = [
		{ value: 'both', label: 'Both sides' },
		{ value: 'start', label: 'Start only' },
		{ value: 'end', label: 'End only' }
	];

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
			if (next.side !== side) side = next.side;
		});
	});

	$effect(() => {
		pushShareState({ text, side }, shareKeys, {
			maxParamBytes,
			defaults: { text: DEFAULT_TEXT, side: DEFAULT_SIDE }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result,
			onReset: () => {
				text = DEFAULT_TEXT;
				side = DEFAULT_SIDE;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="tl-text" label="Text">
		<Textarea id="tl-text" bind:value={text} rows={10} class="font-mono text-sm" />
	</Field>

	<Field id="tl-side" label="Trim">
		<select
			id="tl-side"
			class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
			bind:value={side}
		>
			{#each sides as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</Field>

	<Field id="tl-output" label="Result">
		<Textarea id="tl-output" value={result} rows={10} readonly class="font-mono text-sm" />
	</Field>
</div>
