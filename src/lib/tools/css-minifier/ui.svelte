<script lang="ts">
	import { Alert, Field, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { cssMinifier, run, type CssMinifierInput } from './index';

	const shareKeys = cssMinifier.share!.params;
	const maxParamBytes = cssMinifier.share!.maxParamBytes;
	type Mode = CssMinifierInput['mode'];
	const MODES = new Set<Mode>(['minify', 'beautify']);
	const DEFAULT_MODE: Mode = 'minify';
	const DEFAULT_CSS = '.card {\n  color: #111;\n  padding: 8px 12px; /* spacing */\n}\n';

	function fromUrl() {
		const sp = urlSearchParams();
		const modeRaw = readShareParam(sp, 'mode');
		return {
			css: readShareParam(sp, 'css') ?? DEFAULT_CSS,
			mode: MODES.has(modeRaw as Mode) ? (modeRaw as Mode) : DEFAULT_MODE
		};
	}

	const initial = fromUrl();
	let css = $state(initial.css);
	let mode = $state<Mode>(initial.mode);
	const output = $derived(run({ css, mode }));

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.css !== css) css = next.css;
			if (next.mode !== mode) mode = next.mode;
		});
	});

	$effect(() => {
		pushShareState({ css, mode }, shareKeys, {
			maxParamBytes,
			defaults: { css: DEFAULT_CSS, mode: DEFAULT_MODE }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.error ? '' : output.result,
			downloadValue: output.error ? '' : output.result,
			downloadFilename: mode === 'minify' ? 'minified.css' : 'formatted.css',
			downloadMime: 'text/css;charset=utf-8',
			onReset: () => {
				css = DEFAULT_CSS;
				mode = DEFAULT_MODE;
			}
		});
	});
</script>

<div class="flex max-w-4xl flex-col gap-4">
	<Field id="css-mode" label="Mode">
		<select
			id="css-mode"
			class="h-10 w-full rounded-md border border-border bg-bg px-3 text-sm sm:w-48"
			bind:value={mode}
		>
			<option value="minify">Minify</option>
			<option value="beautify">Beautify</option>
		</select>
	</Field>

	<div class="grid gap-6 lg:grid-cols-2">
		<Field id="css-input" label="CSS input" required>
			<Textarea
				id="css-input"
				bind:value={css}
				rows={14}
				class="font-mono text-sm"
				spellcheck="false"
			/>
		</Field>

		<div class="flex flex-col gap-3">
			{#if output.error}
				<Alert variant="danger" title="Error">{output.error}</Alert>
			{/if}

			<Field id="css-output" label={mode === 'minify' ? 'Minified CSS' : 'Beautified CSS'}>
				<Textarea
					id="css-output"
					value={output.result}
					rows={14}
					readonly
					class="font-mono text-sm"
				/>
			</Field>
		</div>
	</div>
</div>
