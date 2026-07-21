<script lang="ts">
	import { Button, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareNumber
	} from '$engine/tool-share';
	import { uuidGenerator, run } from './index';

	const shareKeys = uuidGenerator.share!.params;
	const DEFAULT_COUNT = 1;

	function fromUrl() {
		const sp = urlSearchParams();
		const raw = readShareNumber(sp, 'count', DEFAULT_COUNT);
		return { count: Math.min(100, Math.max(1, Math.trunc(raw) || DEFAULT_COUNT)) };
	}

	const initial = fromUrl();
	let count = $state(initial.count);
	let uuids = $state<string[]>(run({ count: initial.count, version: 'v4' }).uuids);

	function generate(n = count) {
		const safeCount = Math.min(100, Math.max(1, Number(n) || 1));
		count = safeCount;
		uuids = run({ count: safeCount, version: 'v4' }).uuids;
	}

	const output = $derived(uuids.join('\n'));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.count !== Number(count)) generate(next.count);
		});
	});

	$effect(() => {
		pushShareState({ count }, shareKeys, {
			defaults: { count: String(DEFAULT_COUNT) }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output,
			downloadValue: output,
			downloadFilename: 'uuids.txt',
			onReset: () => {
				generate(DEFAULT_COUNT);
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="uuid-count" label="How many UUIDs?" hint="1–100">
		<Input id="uuid-count" type="number" min="1" max="100" bind:value={count} />
	</Field>

	<div class="flex flex-wrap gap-2">
		<Button type="button" onclick={() => generate()}>Generate</Button>
	</div>

	<Field id="uuid-output" label="Result">
		<Textarea
			id="uuid-output"
			value={output}
			rows={Math.min(12, Math.max(4, uuids.length))}
			readonly
			class="font-mono text-sm"
		/>
	</Field>
</div>
