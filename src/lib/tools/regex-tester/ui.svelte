<script lang="ts">
	import { Alert, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { regexTester, run } from './index';

	const shareKeys = regexTester.share!.params;
	const maxParamBytes = regexTester.share!.maxParamBytes;
	const DEFAULT_PATTERN = '\\b[A-Z][a-z]+\\b';
	const DEFAULT_FLAGS = 'g';
	const DEFAULT_TEXT = 'Hello ToolHub from Ada and Grace.';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			pattern: readShareParam(sp, 'pattern') ?? DEFAULT_PATTERN,
			flags: readShareParam(sp, 'flags') ?? DEFAULT_FLAGS,
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT
		};
	}

	const initial = fromUrl();
	let pattern = $state(initial.pattern);
	let flags = $state(initial.flags);
	let text = $state(initial.text);
	let output = $derived(run({ pattern, flags, text }));
	let copyValue = $derived(
		output.error
			? ''
			: output.matches.length
				? output.matches.map((m) => m.match).join('\n')
				: `${output.count} matches`
	);

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.pattern !== pattern) pattern = next.pattern;
			if (next.flags !== flags) flags = next.flags;
			if (next.text !== text) text = next.text;
		});
	});

	$effect(() => {
		pushShareState({ pattern, flags, text }, shareKeys, {
			maxParamBytes,
			defaults: { pattern: DEFAULT_PATTERN, flags: DEFAULT_FLAGS, text: DEFAULT_TEXT }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue,
			onReset: () => {
				pattern = DEFAULT_PATTERN;
				flags = DEFAULT_FLAGS;
				text = DEFAULT_TEXT;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<div class="grid gap-4 sm:grid-cols-[1fr_6rem]">
		<Field id="re-pattern" label="Pattern" required>
			<Input id="re-pattern" bind:value={pattern} class="font-mono" />
		</Field>
		<Field id="re-flags" label="Flags">
			<Input id="re-flags" bind:value={flags} class="font-mono" />
		</Field>
	</div>

	<Field id="re-text" label="Test string">
		<Textarea id="re-text" bind:value={text} rows={8} />
	</Field>

	{#if output.error}
		<Alert variant="danger" title="Invalid regex">{output.error}</Alert>
	{:else}
		<p class="text-sm text-muted">{output.count} match{output.count === 1 ? '' : 'es'}</p>
		<ul class="space-y-2">
			{#each output.matches as item, i (i)}
				<li class="rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-sm">
					<span class="text-muted">@{item.index}</span>
					<span class="ml-2 text-fg">{item.match}</span>
					{#if item.groups.length}
						<span class="ml-2 text-muted">groups: {item.groups.join(', ')}</span>
					{/if}
				</li>
			{:else}
				<li class="text-sm text-muted">No matches.</li>
			{/each}
		</ul>
	{/if}
</div>
