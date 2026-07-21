<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { wordCounter, run } from './index';

	const shareKeys = wordCounter.share!.params;
	const maxParamBytes = wordCounter.share!.maxParamBytes;
	const DEFAULT_TEXT = '';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let stats = $derived(run({ text }));
	let summary = $derived(`${stats.words} words, ${stats.characters} characters`);

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
		});
	});

	$effect(() => {
		pushShareState({ text }, shareKeys, {
			maxParamBytes,
			defaults: { text: DEFAULT_TEXT }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: summary,
			onReset: () => {
				text = DEFAULT_TEXT;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="word-counter-input" label="Text">
		<Textarea id="word-counter-input" bind:value={text} rows={14} />
	</Field>

	<dl class="grid grid-cols-2 gap-4 self-start rounded-md border border-border bg-bg p-4">
		<div>
			<dt class="text-sm text-muted">Words</dt>
			<dd class="font-display text-2xl font-semibold">{stats.words}</dd>
		</div>
		<div>
			<dt class="text-sm text-muted">Characters</dt>
			<dd class="font-display text-2xl font-semibold">{stats.characters}</dd>
		</div>
		<div>
			<dt class="text-sm text-muted">Without spaces</dt>
			<dd class="font-display text-2xl font-semibold">{stats.charactersNoSpaces}</dd>
		</div>
		<div>
			<dt class="text-sm text-muted">Lines</dt>
			<dd class="font-display text-2xl font-semibold">{stats.lines}</dd>
		</div>
		<div class="col-span-2">
			<dt class="text-sm text-muted">Sentences</dt>
			<dd class="font-display text-2xl font-semibold">{stats.sentences}</dd>
		</div>
	</dl>
</div>
