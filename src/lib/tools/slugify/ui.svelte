<script lang="ts">
	import { Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { slugify, run } from './index';

	const shareKeys = slugify.share!.params;
	const DEFAULT_TEXT = 'Hello ToolHub World';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let slug = $derived(text.trim() ? run({ text }).slug : '');

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
		});
	});

	$effect(() => {
		pushShareState({ text }, shareKeys, {
			defaults: { text: DEFAULT_TEXT }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: slug,
			onReset: () => {
				text = DEFAULT_TEXT;
			}
		});
	});
</script>

<div class="flex max-w-xl flex-col gap-4">
	<Field id="slug-input" label="Text" required>
		<Input id="slug-input" bind:value={text} />
	</Field>
	<Field id="slug-output" label="Slug">
		<Input id="slug-output" value={slug} readonly class="font-mono" />
	</Field>
</div>
