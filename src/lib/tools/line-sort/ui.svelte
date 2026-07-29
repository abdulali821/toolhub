<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam,
		readShareBool
	} from '$engine/tool-share';
	import { lineSort, run, type LineSortInput } from './index';

	const shareKeys = lineSort.share!.params;
	const maxParamBytes = lineSort.share!.maxParamBytes;
	const DEFAULT_TEXT = 'banana\napple\nCherry\napple\ndate\nbanana';
	const DEFAULT_ORDER: LineSortInput['order'] = 'asc';
	const DEFAULT_UNIQUE = false;
	const ORDERS = new Set<LineSortInput['order']>(['asc', 'desc']);

	function fromUrl() {
		const sp = urlSearchParams();
		const orderRaw = readShareParam(sp, 'order');
		const order =
			orderRaw && ORDERS.has(orderRaw as LineSortInput['order'])
				? (orderRaw as LineSortInput['order'])
				: DEFAULT_ORDER;
		return {
			text: readShareParam(sp, 'text') ?? DEFAULT_TEXT,
			order,
			unique: readShareBool(sp, 'unique', DEFAULT_UNIQUE)
		};
	}

	const initial = fromUrl();
	let text = $state(initial.text);
	let order = $state<LineSortInput['order']>(initial.order);
	let unique = $state(initial.unique);
	let output = $derived(run({ text, order, unique }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.text !== text) text = next.text;
			if (next.order !== order) order = next.order;
			if (next.unique !== unique) unique = next.unique;
		});
	});

	$effect(() => {
		pushShareState({ text, order, unique }, shareKeys, {
			maxParamBytes,
			defaults: {
				text: DEFAULT_TEXT,
				order: DEFAULT_ORDER,
				unique: String(DEFAULT_UNIQUE)
			}
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.result,
			onReset: () => {
				text = DEFAULT_TEXT;
				order = DEFAULT_ORDER;
				unique = DEFAULT_UNIQUE;
			}
		});
	});
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<Field id="ls-text" label="Lines">
		<Textarea id="ls-text" bind:value={text} rows={10} class="font-mono text-sm" />
	</Field>

	<div class="flex flex-wrap items-center gap-4">
		<Field id="ls-order" label="Order">
			<select
				id="ls-order"
				class="h-10 w-full min-w-40 rounded-md border border-border bg-bg px-3 text-sm"
				bind:value={order}
			>
				<option value="asc">A → Z</option>
				<option value="desc">Z → A</option>
			</select>
		</Field>

		<label class="mt-6 flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={unique} />
			Unique only
		</label>
	</div>

	<p class="text-sm text-muted">{output.lines} lines</p>

	<Field id="ls-output" label="Result">
		<Textarea id="ls-output" value={output.result} rows={10} readonly class="font-mono text-sm" />
	</Field>
</div>
