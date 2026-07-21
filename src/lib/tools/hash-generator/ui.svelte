<script lang="ts">
	import { Field, Textarea, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { hashGenerator, run, type HashInput } from './index';

	const shareKeys = hashGenerator.share!.params;
	const DEFAULT_TEXT = 'ToolHub';
	const DEFAULT_ALGORITHM: HashInput['algorithm'] = 'SHA-256';
	const ALGORITHMS: HashInput['algorithm'][] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

	function fromUrl() {
		const sp = urlSearchParams();
		const algoRaw = readShareParam(sp, 'algorithm');
		const algorithm: HashInput['algorithm'] = ALGORITHMS.includes(algoRaw as HashInput['algorithm'])
			? (algoRaw as HashInput['algorithm'])
			: DEFAULT_ALGORITHM;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			algorithm
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let algorithm = $state<HashInput['algorithm']>(initial.algorithm);
	let hash = $state('');

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
			if (next.algorithm !== algorithm) algorithm = next.algorithm;
		});
	});

	$effect(() => {
		pushShareState({ text, algorithm }, shareKeys, {
			defaults: { text: DEFAULT_TEXT, algorithm: DEFAULT_ALGORITHM }
		});
	});

	$effect(() => {
		const currentText = text;
		const currentAlgo = algorithm;
		let cancelled = false;
		run({ text: currentText, algorithm: currentAlgo }).then((out) => {
			if (!cancelled) hash = out.hash;
		});
		return () => {
			cancelled = true;
		};
	});

	$effect(() => {
		setToolShellActions({
			copyValue: hash,
			onReset: () => {
				text = DEFAULT_TEXT;
				algorithm = DEFAULT_ALGORITHM;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="hash-algo" label="Algorithm">
		<select
			id="hash-algo"
			class="h-10 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
			bind:value={algorithm}
		>
			<option value="SHA-1">SHA-1</option>
			<option value="SHA-256">SHA-256</option>
			<option value="SHA-384">SHA-384</option>
			<option value="SHA-512">SHA-512</option>
		</select>
	</Field>

	<Field id="hash-input" label="Text">
		<Textarea id="hash-input" bind:value={text} rows={6} />
	</Field>

	<Field id="hash-output" label="Hash (hex)">
		<Input id="hash-output" value={hash} readonly class="font-mono text-sm" />
	</Field>
</div>
