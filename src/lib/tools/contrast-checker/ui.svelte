<script lang="ts">
	import { Alert, Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import { contrastChecker, run } from './index';

	const shareKeys = contrastChecker.share!.params;
	const DEFAULT_FG = '#1e293b';
	const DEFAULT_BG = '#ffffff';

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			fg: readShareParam(sp, 'fg') ?? DEFAULT_FG,
			bg: readShareParam(sp, 'bg') ?? DEFAULT_BG
		};
	}

	const initial = fromUrl();
	let fg = $state(initial.fg);
	let bg = $state(initial.bg);
	let output = $derived(run({ fg, bg }));

	const copySummary = $derived(
		output.error
			? ''
			: `${output.ratioLabel} — AA normal: ${output.aaNormal ? 'pass' : 'fail'}, AAA normal: ${output.aaaNormal ? 'pass' : 'fail'}`
	);

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.fg !== fg) fg = next.fg;
			if (next.bg !== bg) bg = next.bg;
		});
	});

	$effect(() => {
		pushShareState({ fg, bg }, shareKeys, {
			defaults: { fg: DEFAULT_FG, bg: DEFAULT_BG }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: copySummary,
			onReset: () => {
				fg = DEFAULT_FG;
				bg = DEFAULT_BG;
			}
		});
	});

	function passLabel(pass: boolean) {
		return pass ? 'Pass' : 'Fail';
	}
</script>

<div class="flex max-w-2xl flex-col gap-4">
	<div class="grid gap-4 sm:grid-cols-2">
		<Field id="contrast-fg" label="Foreground">
			<div class="flex gap-2">
				<input
					type="color"
					class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
					value={output.fgHex || DEFAULT_FG}
					oninput={(e) => {
						fg = (e.currentTarget as HTMLInputElement).value;
					}}
					aria-label="Pick foreground color"
				/>
				<Input id="contrast-fg" bind:value={fg} class="font-mono" />
			</div>
		</Field>

		<Field id="contrast-bg" label="Background">
			<div class="flex gap-2">
				<input
					type="color"
					class="h-10 w-12 cursor-pointer rounded-md border border-border bg-transparent p-1"
					value={output.bgHex || DEFAULT_BG}
					oninput={(e) => {
						bg = (e.currentTarget as HTMLInputElement).value;
					}}
					aria-label="Pick background color"
				/>
				<Input id="contrast-bg" bind:value={bg} class="font-mono" />
			</div>
		</Field>
	</div>

	{#if output.error}
		<Alert variant="danger" title="Error">{output.error}</Alert>
	{:else}
		<div
			class="rounded-md border border-border p-6"
			style={`background:${output.bgHex}; color:${output.fgHex}`}
		>
			<p class="text-lg font-semibold">Sample heading text</p>
			<p class="mt-2 text-sm">Body text preview for contrast evaluation.</p>
		</div>

		<div class="grid gap-3 sm:grid-cols-2">
			<div class="rounded-md border border-border p-4">
				<p class="text-sm text-muted">Contrast ratio</p>
				<p class="text-2xl font-semibold">{output.ratioLabel}</p>
			</div>
			<div class="rounded-md border border-border p-4 text-sm">
				<p>
					<span class="font-medium">AA normal (4.5:1):</span>
					{passLabel(output.aaNormal)}
				</p>
				<p>
					<span class="font-medium">AA large (3:1):</span>
					{passLabel(output.aaLarge)}
				</p>
				<p>
					<span class="font-medium">AAA normal (7:1):</span>
					{passLabel(output.aaaNormal)}
				</p>
				<p>
					<span class="font-medium">AAA large (4.5:1):</span>
					{passLabel(output.aaaLarge)}
				</p>
			</div>
		</div>
	{/if}
</div>
