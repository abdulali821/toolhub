<script lang="ts">
	import { Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam,
		readShareBool
	} from '$engine/tool-share';
	import { findReplace, run } from './index';

	const shareKeys = findReplace.share!.params;
	const maxParamBytes = findReplace.share!.maxParamBytes;
	const DEFAULT_TEXT = 'The quick brown fox jumps over the lazy dog. The fox is quick.';
	const DEFAULT_FIND = 'fox';
	const DEFAULT_REPLACE = 'cat';
	const DEFAULT_IGNORE_CASE = false;

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			find: readShareParam(sp, 'find') ?? DEFAULT_FIND,
			replace: readShareParam(sp, 'replace') ?? DEFAULT_REPLACE,
			ignoreCase: readShareBool(sp, 'ignoreCase', DEFAULT_IGNORE_CASE)
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let find = $state(initial.find);
	let replace = $state(initial.replace);
	let ignoreCase = $state(initial.ignoreCase);
	let output = $derived(run({ text, find, replace, ignoreCase }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
			if (next.find !== find) find = next.find;
			if (next.replace !== replace) replace = next.replace;
			if (next.ignoreCase !== ignoreCase) ignoreCase = next.ignoreCase;
		});
	});

	$effect(() => {
		pushShareState({ text, find, replace, ignoreCase }, shareKeys, {
			maxParamBytes,
			defaults: {
				text: DEFAULT_TEXT,
				find: DEFAULT_FIND,
				replace: DEFAULT_REPLACE,
				ignoreCase: String(DEFAULT_IGNORE_CASE)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.result,
			onReset: () => {
				text = DEFAULT_TEXT;
				find = DEFAULT_FIND;
				replace = DEFAULT_REPLACE;
				ignoreCase = DEFAULT_IGNORE_CASE;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="fr-text" label="Text">
		<Textarea id="fr-text" bind:value={text} rows={8} />
	</Field>

	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="fr-find" label="Find">
			<Input id="fr-find" bind:value={find} />
		</Field>
		<Field id="fr-replace" label="Replace with">
			<Input id="fr-replace" bind:value={replace} />
		</Field>
	</div>

	<label class="flex items-center gap-2 text-sm">
		<input type="checkbox" bind:checked={ignoreCase} />
		Ignore case
	</label>

	<p class="text-sm text-muted">
		{output.replacements}
		{output.replacements === 1 ? 'replacement' : 'replacements'}
	</p>

	<Field id="fr-output" label="Result">
		<Textarea id="fr-output" value={output.result} rows={8} readonly />
	</Field>
</div>
