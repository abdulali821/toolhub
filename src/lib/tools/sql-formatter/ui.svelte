<script lang="ts">
	import { Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		readShareBool,
		readShareParam,
		urlSearchParams
	} from '$engine/tool-share';
	import { sqlFormatter, run } from './index';

	const shareKeys = sqlFormatter.share!.params;
	const DEFAULT_SQL = 'SELECT id, name FROM users WHERE active = true ORDER BY name LIMIT 10';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			sql: readShareParam(sp, 'sql') ?? DEFAULT_SQL,
			uppercaseKeywords: readShareBool(sp, 'uppercaseKeywords', true)
		};
	}

	const initial = fromUrl();
	let sql = $state(initial.sql);
	let uppercaseKeywords = $state(initial.uppercaseKeywords);
	let result = $derived(run({ sql, uppercaseKeywords }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.sql !== sql) sql = next.sql;
			if (next.uppercaseKeywords !== uppercaseKeywords) uppercaseKeywords = next.uppercaseKeywords;
		});
	});

	$effect(() => {
		pushShareState({ sql, uppercaseKeywords }, shareKeys, {
			defaults: { sql: DEFAULT_SQL, uppercaseKeywords: 'true' }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: result.formatted,
			downloadValue: result.formatted,
			downloadFilename: 'formatted.sql',
			downloadMime: 'text/plain;charset=utf-8',
			onReset: () => {
				sql = DEFAULT_SQL;
				uppercaseKeywords = true;
			}
		});
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<Field id="sql-input" label="SQL input" required>
		<Textarea
			id="sql-input"
			bind:value={sql}
			rows={14}
			class="font-mono text-sm"
			spellcheck="false"
		/>
	</Field>

	<div class="flex flex-col gap-3">
		<label class="flex items-center gap-2 text-sm">
			<input type="checkbox" bind:checked={uppercaseKeywords} class="rounded border-border" />
			Uppercase keywords
		</label>

		<Field id="sql-output" label="Output">
			<Textarea
				id="sql-output"
				value={result.formatted}
				rows={14}
				readonly
				class="font-mono text-sm"
			/>
		</Field>
	</div>
</div>
