<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { caseConverter, run, type CaseConverterInput } from './index';

	const shareKeys = caseConverter.share!.params;
	const DEFAULT_TEXT = 'Hello HeyTools World';
	const DEFAULT_MODE: CaseConverterInput['mode'] = 'title';
	const MODES = new Set<CaseConverterInput['mode']>([
		'upper',
		'lower',
		'title',
		'sentence',
		'camel',
		'pascal',
		'snake',
		'kebab'
	]);

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		const mode =
			modeRaw && MODES.has(modeRaw as CaseConverterInput['mode'])
				? (modeRaw as CaseConverterInput['mode'])
				: DEFAULT_MODE;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			mode
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let mode = $state<CaseConverterInput['mode']>(initial.mode);
	let result = $derived(run({ text, mode }).result);

	const modes: { value: CaseConverterInput['mode']; label: string }[] = [
		{ value: 'upper', label: 'UPPERCASE' },
		{ value: 'lower', label: 'lowercase' },
		{ value: 'title', label: 'Title Case' },
		{ value: 'sentence', label: 'Sentence case' },
		{ value: 'camel', label: 'camelCase' },
		{ value: 'pascal', label: 'PascalCase' },
		{ value: 'snake', label: 'snake_case' },
		{ value: 'kebab', label: 'kebab-case' }
	];

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
			if (next.mode !== mode) mode = next.mode;
		});
	});

	$effect(() => {
		pushShareState({ text, mode }, shareKeys, {
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
	<Field id="case-input" label="Text">
		<Textarea id="case-input" bind:value={text} rows={6} />
	</Field>

	<Field id="case-mode" label="Case">
		<select
			id="case-mode"
			class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
			bind:value={mode}
		>
			{#each modes as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</Field>

	<Field id="case-output" label="Result">
		<Textarea id="case-output" value={result} rows={6} readonly />
	</Field>
</div>
