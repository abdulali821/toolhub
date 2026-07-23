<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { textDiff, run } from './index';

	const shareKeys = textDiff.share!.params;
	const maxParamBytes = textDiff.share!.maxParamBytes;
	const DEFAULT_LEFT = 'hello\nworld\nfoo';
	const DEFAULT_RIGHT = 'hello\nHeyTools\nfoo\nbar';

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
	let output = $derived(run({ left, right }));
	let copyValue = $derived(
		[
			output.summary,
			...output.lines.map(
				(line) => `${line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '} ${line.text}`
			)
		].join('\n')
	);

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
			copyValue,
			onReset: () => {
				left = DEFAULT_LEFT;
				right = DEFAULT_RIGHT;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="diff-left" label="Original">
		<Textarea id="diff-left" bind:value={left} rows={12} class="font-mono text-sm" />
	</Field>
	<Field id="diff-right" label="Changed">
		<Textarea id="diff-right" bind:value={right} rows={12} class="font-mono text-sm" />
	</Field>
</div>

<p class="mt-4 text-sm text-muted">{output.summary}</p>

<pre
	class="mt-3 max-h-112 overflow-auto rounded-md border border-border bg-bg p-3 font-mono text-sm leading-6"
	aria-label="Diff result">{#each output.lines as line, i (i)}<span
			class={line.type === 'add'
				? 'block bg-success-bg text-success'
				: line.type === 'remove'
					? 'block bg-danger-bg text-danger'
					: 'block text-fg'}
			>{line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
			{line.text}
		</span>{/each}</pre>
