<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { whitespaceCleaner, run, type WhitespaceCleanerInput } from './index';

	const shareKeys = whitespaceCleaner.share!.params;
	const maxParamBytes = whitespaceCleaner.share!.maxParamBytes;
	const DEFAULT_TEXT = 'hello   world\r\n\tindented\tline';
	const DEFAULT_MODE: WhitespaceCleanerInput['mode'] = 'collapse';
	const MODES = new Set<WhitespaceCleanerInput['mode']>([
		'collapse',
		'normalize-newlines',
		'strip-all',
		'tabs-to-spaces'
	]);

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode =
			modeRaw && MODES.has(modeRaw as WhitespaceCleanerInput['mode'])
				? (modeRaw as WhitespaceCleanerInput['mode'])
				: DEFAULT_MODE;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			mode
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let mode = $state<WhitespaceCleanerInput['mode']>(initial.mode);
	let result = $derived(run({ text, mode }).result);

	const modes: { value: WhitespaceCleanerInput['mode']; label: string }[] = [
		{ value: 'collapse', label: 'Collapse spaces' },
		{ value: 'normalize-newlines', label: 'Normalize newlines' },
		{ value: 'strip-all', label: 'Strip all whitespace' },
		{ value: 'tabs-to-spaces', label: 'Tabs to spaces' }
	];

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
			if (next.mode !== mode) mode = next.mode;
		});
	});

	$effect(() => {
		pushShareState({ text, mode }, shareKeys, {
			maxParamBytes,
			defaults: { text: DEFAULT_TEXT, mode: DEFAULT_MODE }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result,
			onReset: () => {
				text = DEFAULT_TEXT;
				mode = DEFAULT_MODE;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="wc-text" label="Text">
		<Textarea id="wc-text" bind:value={text} rows={10} class="font-mono text-sm" />
	</Field>

	<Field id="wc-mode" label="Mode">
		<select
			id="wc-mode"
			class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
			bind:value={mode}
		>
			{#each modes as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</Field>

	<Field id="wc-output" label="Result">
		<Textarea id="wc-output" value={result} rows={10} readonly class="font-mono text-sm" />
	</Field>
</div>
