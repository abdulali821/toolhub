<script lang="ts">
	import { Button, Field, Input } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		pullShareState,
		pushShareState,
		urlSearchParams,
		readShareParam
	} from '$engine/tool-share';
	import {
		timezoneMeetingPlanner,
		run,
		TIMEZONE_PRESETS,
		DEFAULT_TIMEZONES,
		defaultDatetimeLocal,
		detectBaseZone,
		type ZoneResult
	} from './index';

	const shareKeys = timezoneMeetingPlanner.share!.params;
	const DEFAULT_DATETIME = defaultDatetimeLocal();
	const baseZone = detectBaseZone();

	function parseZones(raw: string | null): string[] {
		if (!raw) return DEFAULT_TIMEZONES;
		const zones = raw
			.split(',')
			.map((z) => z.trim())
			.filter(Boolean);
		return zones.length ? zones : DEFAULT_TIMEZONES;
	}

	function fromUrl() {
		const sp = urlSearchParams();
		return {
			datetime: readShareParam(sp, 'datetime') ?? DEFAULT_DATETIME,
			zones: parseZones(readShareParam(sp, 'zones'))
		};
	}

	const initial = fromUrl();
	let datetime = $state(initial.datetime);
	let zones = $state<string[]>(initial.zones);

	let output = $derived(
		zones.length ? run({ datetime: datetime || DEFAULT_DATETIME, zones, baseZone }) : null
	);

	function toggleZone(zone: string, checked: boolean) {
		if (checked) {
			if (!zones.includes(zone)) zones = [...zones, zone];
		} else {
			zones = zones.filter((z) => z !== zone);
		}
	}

	function selectAllCities() {
		zones = TIMEZONE_PRESETS.map((p) => p.timeZone);
	}

	function clearCities() {
		zones = [];
	}

	function summaryText(results: ZoneResult[] | undefined): string {
		if (!results?.length) return '';
		return results
			.map(
				(r) => `${r.label} (${r.offset}): ${r.formatted}${r.isOvernight ? ' — next/prev day' : ''}`
			)
			.join('\n');
	}

	$effect(() => {
		pullShareState(fromUrl, (next) => {
			if (next.datetime !== datetime) datetime = next.datetime;
			if (next.zones.join(',') !== zones.join(',')) zones = next.zones;
		});
	});

	$effect(() => {
		pushShareState({ datetime, zones: zones.join(',') }, shareKeys, {
			defaults: { datetime: DEFAULT_DATETIME, zones: DEFAULT_TIMEZONES.join(',') }
		});
	});

	$effect(() => {
		setToolShellActions({
			copyValue: summaryText(output?.results),
			onReset: () => {
				datetime = DEFAULT_DATETIME;
				zones = DEFAULT_TIMEZONES;
			}
		});
	});
</script>

<div class="flex flex-col gap-6">
	<Field
		id="tzp-datetime"
		label="Date &amp; time"
		hint="Interpreted in your device's local timezone"
	>
		<Input id="tzp-datetime" type="datetime-local" bind:value={datetime} class="max-w-xs" />
	</Field>

	<fieldset class="flex flex-col gap-2">
		<div class="flex flex-wrap items-center justify-between gap-2">
			<legend class="text-sm font-medium text-fg">
				Cities to show ({zones.length}/{TIMEZONE_PRESETS.length})
			</legend>
			<div class="flex flex-wrap gap-2">
				<Button type="button" variant="ghost" size="sm" onclick={selectAllCities}>Select all</Button
				>
				<Button type="button" variant="ghost" size="sm" onclick={clearCities}>Clear</Button>
			</div>
		</div>
		<div
			class="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
		>
			{#each TIMEZONE_PRESETS as preset (preset.id)}
				<label
					class="flex items-center gap-2 rounded-md border border-border bg-bg px-2.5 py-2 text-sm text-fg"
				>
					<input
						type="checkbox"
						class="size-4 shrink-0 rounded border-border"
						checked={zones.includes(preset.timeZone)}
						onchange={(e) =>
							toggleZone(preset.timeZone, (e.currentTarget as HTMLInputElement).checked)}
					/>
					<span class="truncate">{preset.label}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	{#if !zones.length}
		<p class="text-sm text-muted">Select at least one city to see converted times.</p>
	{:else if output}
		<div class="overflow-x-auto rounded-md border border-border">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-border bg-bg-elevated text-xs text-muted uppercase">
					<tr>
						<th class="px-3 py-2 font-medium">City</th>
						<th class="px-3 py-2 font-medium">Local time</th>
						<th class="px-3 py-2 font-medium">Date</th>
						<th class="px-3 py-2 font-medium">Offset</th>
						<th class="px-3 py-2 font-medium">Day</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each output.results as row (row.zone)}
						<tr>
							<td class="px-3 py-2">
								<p class="font-medium text-fg">{row.label}</p>
								<p class="text-xs text-muted">{row.zone}</p>
							</td>
							<td class="px-3 py-2 font-mono text-fg">{row.localTime}</td>
							<td class="px-3 py-2 text-muted">{row.localDate}</td>
							<td class="px-3 py-2 font-mono text-muted">{row.offset}</td>
							<td class="px-3 py-2">
								{#if row.isOvernight}
									<span
										class="inline-flex items-center rounded-full bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning"
									>
										{row.dayOffset > 0 ? 'Next day' : 'Prev day'}
									</span>
								{:else}
									<span class="text-xs text-muted">Same day</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
