<script lang="ts">
	import { Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam,
		readShareNumber
	} from '$engine/tool-share';
	import { readingTimeEstimator, run } from './index';

	const shareKeys = readingTimeEstimator.share!.params;
	const maxParamBytes = readingTimeEstimator.share!.maxParamBytes;
	const DEFAULT_WPM = 200;
	const DEFAULT_TEXT = '';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			wpm: Math.min(400, Math.max(100, Math.trunc(readShareNumber(sp, 'wpm', DEFAULT_WPM))))
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let wpm = $state(initial.wpm);
	let output = $derived(run({ text, wpm: Number(wpm) }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
			if (next.wpm !== Number(wpm)) wpm = next.wpm;
		});
	});

	$effect(() => {
		pushShareState({ wpm, text }, shareKeys, {
			maxParamBytes,
			defaults: { wpm: String(DEFAULT_WPM), text: DEFAULT_TEXT }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.formatted,
			onReset: () => {
				text = DEFAULT_TEXT;
				wpm = DEFAULT_WPM;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="rte-text" label="Text">
		<Textarea id="rte-text" bind:value={text} rows={10} />
	</Field>

	<Field id="rte-wpm" label="Reading speed (words per minute)" hint="100–400">
		<Input id="rte-wpm" type="number" min="100" max="400" bind:value={wpm} />
	</Field>

	<div class="rounded-md border border-border bg-bg-elevated p-4">
		<p class="text-2xl font-semibold text-fg">{output.formatted}</p>
		<dl class="mt-3 grid grid-cols-3 gap-3 text-sm text-muted">
			<div>
				<dt class="text-xs tracking-wide uppercase">Words</dt>
				<dd class="font-mono text-fg">{output.words}</dd>
			</div>
			<div>
				<dt class="text-xs tracking-wide uppercase">Characters</dt>
				<dd class="font-mono text-fg">{output.characters}</dd>
			</div>
			<div>
				<dt class="text-xs tracking-wide uppercase">Seconds</dt>
				<dd class="font-mono text-fg">{output.seconds}</dd>
			</div>
		</dl>
	</div>
</div>
