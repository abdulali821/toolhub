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
	import { addPrefixSuffix, run } from './index';

	const shareKeys = addPrefixSuffix.share!.params;
	const maxParamBytes = addPrefixSuffix.share!.maxParamBytes;
	const DEFAULT_TEXT = 'alpha\n\nbeta\ngamma';
	const DEFAULT_PREFIX = '- ';
	const DEFAULT_SUFFIX = '';
	const DEFAULT_SKIP_EMPTY = true;

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			prefix: readShareParam(sp, 'prefix') ?? DEFAULT_PREFIX,
			suffix: readShareParam(sp, 'suffix') ?? DEFAULT_SUFFIX,
			skipEmpty: readShareBool(sp, 'skipEmpty', DEFAULT_SKIP_EMPTY)
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let prefix = $state(initial.prefix);
	let suffix = $state(initial.suffix);
	let skipEmpty = $state(initial.skipEmpty);
	let result = $derived(run({ text, prefix, suffix, skipEmpty }).result);

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
			if (next.prefix !== prefix) prefix = next.prefix;
			if (next.suffix !== suffix) suffix = next.suffix;
			if (next.skipEmpty !== skipEmpty) skipEmpty = next.skipEmpty;
		});
	});

	$effect(() => {
		pushShareState({ text, prefix, suffix, skipEmpty }, shareKeys, {
			maxParamBytes,
			defaults: {
				text: DEFAULT_TEXT,
				prefix: DEFAULT_PREFIX,
				suffix: DEFAULT_SUFFIX,
				skipEmpty: String(DEFAULT_SKIP_EMPTY)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result,
			onReset: () => {
				text = DEFAULT_TEXT;
				prefix = DEFAULT_PREFIX;
				suffix = DEFAULT_SUFFIX;
				skipEmpty = DEFAULT_SKIP_EMPTY;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="aps-text" label="Lines">
		<Textarea id="aps-text" bind:value={text} rows={10} class="font-mono text-sm" />
	</Field>

	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="aps-prefix" label="Prefix">
			<Input id="aps-prefix" bind:value={prefix} />
		</Field>
		<Field id="aps-suffix" label="Suffix">
			<Input id="aps-suffix" bind:value={suffix} />
		</Field>
	</div>

	<label class="flex items-center gap-2 text-sm">
		<input type="checkbox" bind:checked={skipEmpty} />
		Skip empty lines
	</label>

	<Field id="aps-output" label="Result">
		<Textarea id="aps-output" value={result} rows={10} readonly class="font-mono text-sm" />
	</Field>
</div>
