<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { Button } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import {
		formatKeyEvent,
		modifiersFromEvent,
		locationLabel,
		KEYBOARD_ROWS,
		NAV_CLUSTER,
		type KeyLogEntry,
		type KeyboardTesterInput
	} from './index';

	const MAX_LOG = 20;

	let panelEl: HTMLDivElement | undefined = $state();
	let capturing = $state(false);
	let lastEvent = $state<KeyLogEntry | null>(null);
	const pressedCodes = new SvelteSet<string>();
	let log = $state<KeyLogEntry[]>([]);

	function toEntry(e: KeyboardEvent, type: 'keydown' | 'keyup'): KeyLogEntry {
		return {
			type,
			key: e.key,
			code: e.code,
			keyCode: e.keyCode,
			location: e.location,
			ctrlKey: e.ctrlKey,
			altKey: e.altKey,
			shiftKey: e.shiftKey,
			metaKey: e.metaKey,
			timestamp: Date.now()
		};
	}

	function isCapturing(): boolean {
		return typeof document !== 'undefined' && document.activeElement === panelEl;
	}

	function onWindowKeyDown(e: KeyboardEvent) {
		if (!isCapturing()) return;
		// Prevent default only while the capture panel is focused, so browser
		// shortcuts and page scrolling keep working everywhere else.
		e.preventDefault();
		const entry = toEntry(e, 'keydown');
		lastEvent = entry;
		pressedCodes.add(entry.code);
		log = [entry, ...log].slice(0, MAX_LOG);
	}

	function onWindowKeyUp(e: KeyboardEvent) {
		if (!isCapturing()) return;
		e.preventDefault();
		const entry = toEntry(e, 'keyup');
		lastEvent = entry;
		pressedCodes.delete(entry.code);
	}

	function onPanelBlur() {
		capturing = false;
		pressedCodes.clear();
	}

	function clearLog() {
		log = [];
		lastEvent = null;
		pressedCodes.clear();
	}

	function copyValueFor(entry: KeyboardTesterInput | null): string {
		return entry ? formatKeyEvent(entry) : '';
	}

	$effect(() => {
		window.addEventListener('keydown', onWindowKeyDown);
		window.addEventListener('keyup', onWindowKeyUp);
		return () => {
			window.removeEventListener('keydown', onWindowKeyDown);
			window.removeEventListener('keyup', onWindowKeyUp);
		};
	});

	$effect(() => {
		setToolShellActions({
			copyValue: copyValueFor(lastEvent),
			onReset: clearLog
		});
	});
</script>

<div class="flex flex-col gap-5">
	<div
		bind:this={panelEl}
		tabindex="0"
		role="button"
		aria-label="Keyboard capture panel — click here, then press any key"
		onfocus={() => (capturing = true)}
		onblur={onPanelBlur}
		class="flex min-h-24 flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center outline-none transition-colors {capturing
			? 'border-accent bg-accent/5'
			: 'border-border bg-bg'}"
	>
		{#if !lastEvent}
			<p class="text-sm text-muted">
				{capturing ? 'Press any key…' : 'Click here, then press any key to test it'}
			</p>
		{:else}
			<div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
				<div>
					<p class="text-xs tracking-wide text-muted uppercase">Key</p>
					<p class="font-mono text-lg font-semibold text-fg">
						{lastEvent.key === ' ' ? 'Space' : lastEvent.key}
					</p>
				</div>
				<div>
					<p class="text-xs tracking-wide text-muted uppercase">Code</p>
					<p class="font-mono text-lg font-semibold text-fg">{lastEvent.code}</p>
				</div>
				<div>
					<p class="text-xs tracking-wide text-muted uppercase">KeyCode</p>
					<p class="font-mono text-lg font-semibold text-fg">{lastEvent.keyCode}</p>
				</div>
				<div>
					<p class="text-xs tracking-wide text-muted uppercase">Location</p>
					<p class="font-mono text-lg font-semibold text-fg">{locationLabel(lastEvent.location)}</p>
				</div>
				<div>
					<p class="text-xs tracking-wide text-muted uppercase">State</p>
					<p class="font-mono text-lg font-semibold text-fg">
						{lastEvent.type === 'keydown' ? 'Pressed' : 'Released'}
					</p>
				</div>
			</div>
			{#if modifiersFromEvent(lastEvent).length}
				<div class="mt-3 flex flex-wrap justify-center gap-1.5">
					{#each modifiersFromEvent(lastEvent) as mod (mod)}
						<span
							class="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
						>
							{mod}
						</span>
					{/each}
				</div>
			{/if}
		{/if}
	</div>

	<div class="overflow-x-auto rounded-xl border border-border bg-bg p-3">
		<div class="flex min-w-max flex-col gap-1.5">
			{#each KEYBOARD_ROWS as row, ri (ri)}
				<div class="flex gap-1.5">
					{#each row as keyDef (keyDef.code)}
						<div
							class="flex h-9 items-center justify-center rounded-md border text-xs font-medium transition-colors {pressedCodes.has(
								keyDef.code
							)
								? 'border-accent bg-accent text-white'
								: 'border-border bg-bg-elevated text-fg'}"
							style="width: {(keyDef.width ?? 1) * 2.25}rem"
						>
							{keyDef.label}
						</div>
					{/each}
				</div>
			{/each}
			<div class="mt-1 flex justify-end gap-1.5">
				{#each NAV_CLUSTER as keyDef (keyDef.code)}
					<div
						class="flex h-9 w-9 items-center justify-center rounded-md border text-xs font-medium transition-colors {pressedCodes.has(
							keyDef.code
						)
							? 'border-accent bg-accent text-white'
							: 'border-border bg-bg-elevated text-fg'}"
					>
						{keyDef.label}
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between gap-2">
			<p class="text-sm font-medium text-fg">Event log (last {MAX_LOG})</p>
			<Button type="button" variant="ghost" size="sm" onclick={clearLog}>Clear</Button>
		</div>
		{#if log.length}
			<ul
				class="max-h-64 overflow-y-auto rounded-xl border border-border bg-bg font-mono text-xs"
			>
				{#each log as entry, i (entry.timestamp + entry.code + i)}
					<li class="border-b border-border px-3 py-1.5 text-fg last:border-b-0">
						{formatKeyEvent(entry)}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted">
				No keys pressed yet.
			</p>
		{/if}
	</div>
</div>
