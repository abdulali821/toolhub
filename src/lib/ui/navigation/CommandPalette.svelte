<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { listTools } from '$tools';
	import { categories } from '$lib/config/site';
	import { listCollections } from '$lib/config/collections';
	import { registerCommandPalette } from './command-palette-state';

	type PaletteItem = {
		id: string;
		label: string;
		description: string;
		href: string;
		group: string;
	};

	let open = $state(false);
	let query = $state('');
	let activeIndex = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);
	let listEl = $state<HTMLUListElement | null>(null);
	let dialogEl = $state<HTMLDivElement | null>(null);
	let previousActiveElement = $state<HTMLElement | null>(null);

	const tools = listTools();
	const packs = listCollections();

	const staticItems: PaletteItem[] = [
		{
			id: 'nav-tools',
			label: 'All tools',
			description: 'Browse the full catalog',
			href: '/tools',
			group: 'Navigate'
		},
		{
			id: 'nav-search',
			label: 'Search',
			description: 'Full-page search',
			href: '/search',
			group: 'Navigate'
		},
		{
			id: 'nav-home',
			label: 'Home',
			description: 'HeyTools homepage',
			href: '/',
			group: 'Navigate'
		},
		{
			id: 'nav-privacy',
			label: 'Privacy',
			description: 'Trust & privacy policy',
			href: '/privacy',
			group: 'Navigate'
		},
		{
			id: 'nav-request-tool',
			label: 'Request a tool',
			description: 'Suggest a new utility',
			href: '/request-tool',
			group: 'Navigate'
		},
		...categories.map((c) => ({
			id: `cat-${c.id}`,
			label: c.label,
			description: c.description,
			href: `/tools?category=${c.id}`,
			group: 'Categories'
		})),
		...packs.map((p) => ({
			id: `pack-${p.id}`,
			label: p.name,
			description: p.description,
			href: `/#pack-${p.id}`,
			group: 'Packs'
		})),
		...tools.map((t) => ({
			id: `tool-${t.id}`,
			label: t.name,
			description: t.description,
			href: `/tools/${t.id}`,
			group: 'Tools'
		}))
	];

	function scoreItem(item: PaletteItem, q: string): number {
		if (!q) return item.group === 'Navigate' || item.group === 'Categories' ? 3 : 1;
		const hay = `${item.label} ${item.description} ${item.id}`.toLowerCase();
		const needle = q.toLowerCase();
		let score = 0;
		if (item.label.toLowerCase() === needle) score += 100;
		if (item.label.toLowerCase().startsWith(needle)) score += 50;
		if (hay.includes(needle)) score += 20;
		for (const token of needle.split(/\s+/).filter(Boolean)) {
			if (hay.includes(token)) score += 5;
		}
		return score;
	}

	const results = $derived.by(() => {
		const q = query.trim();
		const scored = staticItems
			.map((item) => ({ item, score: scoreItem(item, q) }))
			.filter((row) => row.score > 0)
			.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
		const limit = q ? 24 : 18;
		return scored.slice(0, limit).map((row) => row.item);
	});

	const grouped = $derived.by(() => {
		const map: Record<string, PaletteItem[]> = {};
		for (const item of results) {
			(map[item.group] ??= []).push(item);
		}
		return Object.entries(map);
	});

	const flat = $derived(results);

	function getFocusableElements(): HTMLElement[] {
		if (!dialogEl) return [];
		return Array.from(
			dialogEl.querySelectorAll<HTMLElement>(
				'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
	}

	function openPalette() {
		previousActiveElement =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		open = true;
		query = '';
		activeIndex = 0;
		queueMicrotask(() => inputEl?.focus());
	}

	function closePalette() {
		open = false;
		query = '';
		activeIndex = 0;
		const restore = previousActiveElement;
		previousActiveElement = null;
		queueMicrotask(() => restore?.focus());
	}

	function onDialogKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;

		const focusable = getFocusableElements();
		if (focusable.length === 0) return;

		const first = focusable[0]!;
		const last = focusable[focusable.length - 1]!;

		if (event.shiftKey) {
			if (document.activeElement === first || !dialogEl?.contains(document.activeElement)) {
				event.preventDefault();
				last.focus();
			}
		} else if (document.activeElement === last || !dialogEl?.contains(document.activeElement)) {
			event.preventDefault();
			first.focus();
		}
	}

	async function select(item: PaletteItem) {
		closePalette();
		await goto(item.href);
	}

	function onKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		const tagging =
			target &&
			(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

		const isMod = event.metaKey || event.ctrlKey;
		if (isMod && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			if (open) closePalette();
			else openPalette();
			return;
		}

		if (!open) return;
		if (
			tagging &&
			event.key !== 'Escape' &&
			event.key !== 'ArrowDown' &&
			event.key !== 'ArrowUp' &&
			event.key !== 'Enter'
		) {
			// allow typing in the palette input
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			closePalette();
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = flat.length ? (activeIndex + 1) % flat.length : 0;
			scrollActive();
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = flat.length ? (activeIndex - 1 + flat.length) % flat.length : 0;
			scrollActive();
			return;
		}

		if (event.key === 'Enter') {
			event.preventDefault();
			const item = flat[activeIndex];
			if (item) void select(item);
		}
	}

	function scrollActive() {
		queueMicrotask(() => {
			const el = listEl?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
			el?.scrollIntoView({ block: 'nearest' });
		});
	}

	$effect(() => {
		void query;
		activeIndex = 0;
	});

	onMount(() => registerCommandPalette(openPalette));
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<div class="fixed inset-0 z-60 flex items-start justify-center px-4 pt-[12vh]">
		<button
			type="button"
			class="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
			aria-label="Close command palette"
			onclick={closePalette}
		></button>

		<div
			bind:this={dialogEl}
			class="relative z-10 flex max-h-[min(70vh,32rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1c1c1e] text-white shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Command palette"
			tabindex="-1"
			onkeydown={onDialogKeydown}
		>
			<div class="flex items-center gap-3 border-b border-white/10 px-4 py-3">
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden="true"
					class="shrink-0 text-white/40"
				>
					<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.75" />
					<path
						d="M20 20l-3.5-3.5"
						stroke="currentColor"
						stroke-width="1.75"
						stroke-linecap="round"
					/>
				</svg>
				<label class="sr-only" for="command-palette-input">Search tools and pages</label>
				<input
					id="command-palette-input"
					bind:this={inputEl}
					bind:value={query}
					class="h-10 w-full bg-transparent text-base text-white outline-none placeholder:text-white/40"
					placeholder="Type a command or search tools..."
					autocomplete="off"
					autocorrect="off"
					spellcheck="false"
				/>
				<kbd
					class="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-white/45 sm:inline"
					>⌘K</kbd
				>
			</div>

			{#if flat.length === 0}
				<p class="px-4 py-8 text-center text-sm text-white/45">No matches for “{query}”.</p>
			{:else}
				<ul
					bind:this={listEl}
					class="flex-1 overflow-y-auto p-2"
					role="listbox"
					aria-label="Results"
				>
					{#each grouped as [group, items] (group)}
						<li
							class="px-2 pt-3 pb-1 text-[11px] font-semibold tracking-wider text-white/35 uppercase"
						>
							{group}
						</li>
						{#each items as item (item.id)}
							{@const index = flat.findIndex((f) => f.id === item.id)}
							<li role="option" aria-selected={index === activeIndex} data-index={index}>
								<button
									type="button"
									class="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors {index ===
									activeIndex
										? 'bg-white/10'
										: 'hover:bg-white/5'}"
									onmouseenter={() => (activeIndex = index)}
									onclick={() => select(item)}
								>
									<span class="min-w-0">
										<span class="block text-sm font-medium text-white">{item.label}</span>
										<span class="mt-0.5 line-clamp-1 block text-xs text-white/45">
											{item.description}
										</span>
									</span>
									<span class="shrink-0 text-white/30" aria-hidden="true">→</span>
								</button>
							</li>
						{/each}
					{/each}
				</ul>
			{/if}

			<div
				class="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-xs text-white/40"
			>
				<span>↵ select · ↑↓ navigate</span>
				<span>esc close</span>
			</div>
		</div>
	</div>
{/if}
