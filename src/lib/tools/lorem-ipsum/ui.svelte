<script lang="ts">
	import { Button, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareNumber
	} from '$engine/tool-share';
	import { loremIpsum, run } from './index';

	const shareKeys = loremIpsum.share!.params;
	const DEFAULT_PARAGRAPHS = 2;
	const DEFAULT_WORDS = 40;

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			paragraphs: readShareNumber(sp, 'paragraphs', DEFAULT_PARAGRAPHS),
			wordsPerParagraph: readShareNumber(sp, 'wordsPerParagraph', DEFAULT_WORDS)
		};
	}

	const initial = fromUrl();
	let paragraphs = $state(initial.paragraphs);
	let wordsPerParagraph = $state(initial.wordsPerParagraph);
	let text = $state(
		run({ paragraphs: initial.paragraphs, wordsPerParagraph: initial.wordsPerParagraph }).text
	);

	function generate() {
		const p = Math.min(20, Math.max(1, Number(paragraphs) || 1));
		const w = Math.min(120, Math.max(10, Number(wordsPerParagraph) || 40));
		paragraphs = p;
		wordsPerParagraph = w;
		text = run({ paragraphs: p, wordsPerParagraph: w }).text;
	}

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			let changed = false;
			if (next.paragraphs !== Number(paragraphs)) {
				paragraphs = next.paragraphs;
				changed = true;
			}
			if (next.wordsPerParagraph !== Number(wordsPerParagraph)) {
				wordsPerParagraph = next.wordsPerParagraph;
				changed = true;
			}
			if (changed) generate();
		});
	});

	$effect(() => {
		pushShareState({ paragraphs, wordsPerParagraph }, shareKeys, {
			defaults: {
				paragraphs: String(DEFAULT_PARAGRAPHS),
				wordsPerParagraph: String(DEFAULT_WORDS)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: text,
			downloadValue: text,
			downloadFilename: 'lorem-ipsum.txt',
			downloadMime: 'text/plain;charset=utf-8',
			onReset: () => {
				paragraphs = DEFAULT_PARAGRAPHS;
				wordsPerParagraph = DEFAULT_WORDS;
				generate();
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="lorem-paragraphs" label="Paragraphs">
			<Input id="lorem-paragraphs" type="number" min="1" max="20" bind:value={paragraphs} />
		</Field>
		<Field id="lorem-words" label="Words per paragraph">
			<Input id="lorem-words" type="number" min="10" max="120" bind:value={wordsPerParagraph} />
		</Field>
	</div>

	<div class="flex flex-wrap gap-2">
		<Button type="button" onclick={generate}>Generate</Button>
	</div>

	<Field id="lorem-output" label="Output">
		<Textarea id="lorem-output" value={text} rows={12} readonly />
	</Field>
</div>
