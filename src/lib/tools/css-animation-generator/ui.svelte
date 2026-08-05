<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { Button, Field, Input, Textarea } from '$ui';
	import { setToolShellActions } from '$ui/tools/tool-shell-context';
	import { readShareNumber, readShareParam } from '$engine/share-state';
	import { syncShareParams } from '$engine/sync-share';
	import {
		cssAnimationGenerator,
		run,
		encodeSteps,
		decodeSteps,
		DEFAULT_INPUT,
		DEFAULT_STEPS,
		DIRECTIONS,
		FILL_MODES,
		EASING_PRESETS,
		ANIMATION_OPTIONS,
		getAnimationOption,
		resolveAnimationId,
		inputFromAnimation,
		type AnimDirection,
		type AnimFillMode,
		type EasingPreset,
		type KeyframeStep
	} from './index';

	const shareKeys = cssAnimationGenerator.share!.params;
	const maxParamBytes = cssAnimationGenerator.share!.maxParamBytes;

	function isDirection(value: string | null): value is AnimDirection {
		return !!value && (DIRECTIONS as readonly string[]).includes(value);
	}

	function isFillMode(value: string | null): value is AnimFillMode {
		return !!value && (FILL_MODES as readonly string[]).includes(value);
	}

	function easingPresetFromValue(easing: string): EasingPreset {
		if ((EASING_PRESETS as readonly string[]).includes(easing) && easing !== 'custom') {
			return easing as EasingPreset;
		}
		return 'custom';
	}

	function optionsFromUrl() {
		const sp = page.url.searchParams;
		const directionRaw = readShareParam(sp, 'direction');
		const fillRaw = readShareParam(sp, 'fillMode');
		const name = resolveAnimationId(readShareParam(sp, 'name'));
		const option = getAnimationOption(name)!;
		const easing = readShareParam(sp, 'easing') ?? option.easing;
		const stepsParam = readShareParam(sp, 'steps');
		return {
			name,
			duration: readShareNumber(sp, 'duration', option.duration),
			delay: readShareNumber(sp, 'delay', option.delay),
			iteration: readShareParam(sp, 'iteration') ?? option.iteration,
			direction: isDirection(directionRaw) ? directionRaw : option.direction,
			fillMode: isFillMode(fillRaw) ? fillRaw : option.fillMode,
			easing,
			steps: decodeSteps(stepsParam, option.steps)
		};
	}

	const initial = optionsFromUrl();
	let name = $state(initial.name);
	let duration = $state(initial.duration);
	let delay = $state(initial.delay);
	let iteration = $state(initial.iteration);
	let direction = $state<AnimDirection>(initial.direction);
	let fillMode = $state<AnimFillMode>(initial.fillMode);
	let easing = $state(initial.easing);
	let easingPreset = $state<EasingPreset>(easingPresetFromValue(initial.easing));
	let steps = $state<KeyframeStep[]>(initial.steps.map((s) => ({ ...s })));
	let playing = $state(true);
	let replayToken = $state(0);

	let output = $derived(
		run({
			name,
			duration: Math.max(0, Number(duration) || 0),
			delay: Math.max(0, Number(delay) || 0),
			iteration,
			direction,
			fillMode,
			easing,
			steps
		})
	);

	let previewStyle = $derived(
		`animation:${output.animation};animation-play-state:${playing ? 'running' : 'paused'};`
	);

	function applyAnimation(id: string) {
		const option = getAnimationOption(id);
		if (!option) return;
		const next = inputFromAnimation(option);
		name = next.name;
		duration = next.duration;
		delay = next.delay;
		iteration = next.iteration;
		direction = next.direction;
		fillMode = next.fillMode;
		easing = next.easing;
		easingPreset = easingPresetFromValue(next.easing);
		steps = next.steps;
		replay();
	}

	function onEasingPresetChange(next: EasingPreset) {
		easingPreset = next;
		if (next !== 'custom') easing = next;
	}

	function addStep() {
		const last = steps[steps.length - 1];
		steps = [
			...steps,
			{
				percent: Math.min(100, (last?.percent ?? 0) + 25),
				opacity: last?.opacity ?? '1',
				transform: last?.transform ?? '',
				backgroundColor: last?.backgroundColor ?? ''
			}
		];
	}

	function removeStep(index: number) {
		if (steps.length <= 1) return;
		steps = steps.filter((_, i) => i !== index);
	}

	function updateStep(index: number, patch: Partial<KeyframeStep>) {
		steps = steps.map((step, i) => (i === index ? { ...step, ...patch } : step));
	}

	function replay() {
		replayToken += 1;
		playing = true;
	}

	function resetAll() {
		applyAnimation(DEFAULT_INPUT.name);
	}

	$effect(() => {
		const next = optionsFromUrl();
		untrack(() => {
			if (next.name !== name) name = next.name;
			if (next.duration !== Number(duration)) duration = next.duration;
			if (next.delay !== Number(delay)) delay = next.delay;
			if (next.iteration !== iteration) iteration = next.iteration;
			if (next.direction !== direction) direction = next.direction;
			if (next.fillMode !== fillMode) fillMode = next.fillMode;
			if (next.easing !== easing) {
				easing = next.easing;
				easingPreset = easingPresetFromValue(next.easing);
			}
			const encoded = encodeSteps(steps);
			const nextEncoded = encodeSteps(next.steps);
			if (encoded !== nextEncoded) steps = next.steps.map((s) => ({ ...s }));
		});
	});

	$effect(() => {
		syncShareParams(
			{
				name,
				duration,
				delay,
				iteration,
				direction,
				fillMode,
				easing,
				steps: encodeSteps(steps)
			},
			shareKeys,
			{
				maxParamBytes,
				defaults: {
					name: DEFAULT_INPUT.name,
					duration: String(DEFAULT_INPUT.duration),
					delay: String(DEFAULT_INPUT.delay),
					iteration: DEFAULT_INPUT.iteration,
					direction: DEFAULT_INPUT.direction,
					fillMode: DEFAULT_INPUT.fillMode,
					easing: DEFAULT_INPUT.easing,
					steps: encodeSteps(DEFAULT_STEPS)
				}
			}
		);
	});

	$effect(() => {
		setToolShellActions({
			copyValue: output.css,
			onReset: resetAll
		});
	});

	$effect(() => {
		if (typeof document === 'undefined') return;
		const id = 'heytools-css-anim-preview';
		let el = document.getElementById(id) as HTMLStyleElement | null;
		if (!el) {
			el = document.createElement('style');
			el.id = id;
			document.head.appendChild(el);
		}
		el.textContent = output.keyframes;
	});
</script>

<div class="grid gap-6 lg:grid-cols-2">
	<div class="flex flex-col gap-4">
		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="cag-name" label="Animation">
				<select
					id="cag-name"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					value={name}
					onchange={(e) => applyAnimation((e.currentTarget as HTMLSelectElement).value)}
				>
					{#each ANIMATION_OPTIONS as option (option.id)}
						<option value={option.id}>{option.label}</option>
					{/each}
				</select>
			</Field>
			<Field id="cag-iteration" label="Iteration" hint="number or infinite">
				<Input id="cag-iteration" bind:value={iteration} class="font-mono text-sm" />
			</Field>
			<Field id="cag-duration" label="Duration (s)">
				<Input id="cag-duration" type="number" min="0" step="0.1" bind:value={duration} />
			</Field>
			<Field id="cag-delay" label="Delay (s)">
				<Input id="cag-delay" type="number" min="0" step="0.1" bind:value={delay} />
			</Field>
			<Field id="cag-direction" label="Direction">
				<select
					id="cag-direction"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					bind:value={direction}
				>
					{#each DIRECTIONS as value (value)}
						<option {value}>{value}</option>
					{/each}
				</select>
			</Field>
			<Field id="cag-fill" label="Fill mode">
				<select
					id="cag-fill"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					bind:value={fillMode}
				>
					{#each FILL_MODES as value (value)}
						<option {value}>{value}</option>
					{/each}
				</select>
			</Field>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<Field id="cag-easing-preset" label="Easing">
				<select
					id="cag-easing-preset"
					class="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm"
					value={easingPreset}
					onchange={(e) =>
						onEasingPresetChange((e.currentTarget as HTMLSelectElement).value as EasingPreset)}
				>
					{#each EASING_PRESETS as value (value)}
						<option {value}>{value}</option>
					{/each}
				</select>
			</Field>
			{#if easingPreset === 'custom'}
				<Field id="cag-easing" label="Custom timing function">
					<Input
						id="cag-easing"
						bind:value={easing}
						class="font-mono text-sm"
						placeholder="cubic-bezier(0.4, 0, 0.2, 1)"
					/>
				</Field>
			{/if}
		</div>

		<div class="flex flex-col gap-3">
			<div class="flex items-center justify-between gap-2">
				<p class="text-sm font-medium text-fg">Keyframes</p>
				<Button type="button" variant="secondary" size="sm" onclick={addStep}>Add step</Button>
			</div>

			{#each steps as step, index (index)}
				<div class="rounded-xl border border-border bg-bg p-3">
					<div class="mb-3 flex items-center justify-between gap-2">
						<p class="text-xs font-medium text-muted">Step {index + 1}</p>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={steps.length <= 1}
							onclick={() => removeStep(index)}
						>
							Remove
						</Button>
					</div>
					<div class="grid gap-3 sm:grid-cols-2">
						<Field id={`cag-p-${index}`} label="Percent">
							<Input
								id={`cag-p-${index}`}
								type="number"
								min="0"
								max="100"
								value={step.percent}
								oninput={(e) =>
									updateStep(index, {
										percent: Number((e.currentTarget as HTMLInputElement).value)
									})}
							/>
						</Field>
						<Field id={`cag-o-${index}`} label="Opacity" hint="optional">
							<Input
								id={`cag-o-${index}`}
								value={step.opacity}
								class="font-mono text-sm"
								placeholder="0 → 1"
								oninput={(e) =>
									updateStep(index, {
										opacity: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</Field>
						<Field id={`cag-t-${index}`} label="Transform" hint="optional">
							<Input
								id={`cag-t-${index}`}
								value={step.transform}
								class="font-mono text-sm"
								placeholder="translateY(12px)"
								oninput={(e) =>
									updateStep(index, {
										transform: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</Field>
						<Field id={`cag-b-${index}`} label="Background" hint="optional">
							<Input
								id={`cag-b-${index}`}
								value={step.backgroundColor}
								class="font-mono text-sm"
								placeholder="#2563eb"
								oninput={(e) =>
									updateStep(index, {
										backgroundColor: (e.currentTarget as HTMLInputElement).value
									})}
							/>
						</Field>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-4">
		<div class="flex flex-wrap items-center gap-2">
			<Button type="button" variant="secondary" size="sm" onclick={() => (playing = !playing)}>
				{playing ? 'Pause' : 'Play'}
			</Button>
			<Button type="button" variant="ghost" size="sm" onclick={replay}>Replay</Button>
		</div>

		<div
			class="flex min-h-56 items-center justify-center rounded-2xl border border-border bg-bg p-8"
		>
			{#key replayToken}
				<div
					class="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-white shadow-sm"
					style={previewStyle}
					aria-label="Animation preview"
				>
					Hey
				</div>
			{/key}
		</div>

		<Field id="cag-css" label="CSS">
			<Textarea id="cag-css" value={output.css} rows={16} readonly class="font-mono text-sm" />
		</Field>
	</div>
</div>
