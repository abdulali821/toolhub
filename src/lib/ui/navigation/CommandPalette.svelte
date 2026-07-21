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
			id: 'nav-categories',
			label: 'Categories',
			description: 'SEO category landings',
			href: '/categories',
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
			description: 'ToolHub homepage',
			href: '/',
			group: 'Navigate'
		},
		...categories.map((c) => ({
			id: `cat-${c.id}`,
			label: c.label,
			description: c.description,
			href: `/categories/${c.id}`,
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
	<div class="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
		<button
			type="button"
			class="absolute inset-0 bg-fg/40 backdrop-blur-[2px]"
			aria-label="Close command palette"
			onclick={closePalette}
		></button>

		<div
			bind:this={dialogEl}
			class="relative z-10 flex max-h-[min(70vh,32rem)] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-label="Command palette"
			tabindex="-1"
			onkeydown={onDialogKeydown}
		>
			<div class="border-b border-border px-3 py-2">
				<label class="sr-only" for="command-palette-input">Search tools and pages</label>
				<input
					id="command-palette-input"
					bind:this={inputEl}
					bind:value={query}
					class="h-11 w-full bg-transparent text-base text-fg outline-none placeholder:text-muted"
					placeholder="Search tools, categories, packs…"
					autocomplete="off"
					autocorrect="off"
					spellcheck="false"
				/>
			</div>

			{#if flat.length === 0}
				<p class="px-4 py-8 text-center text-sm text-muted">No matches for “{query}”.</p>
			{:else}
				<ul
					bind:this={listEl}
					class="flex-1 overflow-y-auto p-2"
					role="listbox"
					aria-label="Results"
				>
					{#each grouped as [group, items] (group)}
						<li class="px-2 pt-2 pb-1 text-xs font-semibold tracking-wide text-muted uppercase">
							{group}
						</li>
						{#each items as item (item.id)}
							{@const index = flat.findIndex((f) => f.id === item.id)}
							<li role="option" aria-selected={index === activeIndex} data-index={index}>
								<button
									type="button"
									class="flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors {index ===
									activeIndex
										? 'bg-accent text-accent-fg'
										: 'hover:bg-bg'}"
									onmouseenter={() => (activeIndex = index)}
									onclick={() => select(item)}
								>
									<span class="text-sm font-medium">{item.label}</span>
									<span
										class="line-clamp-1 text-xs {index === activeIndex
											? 'text-accent-fg/80'
											: 'text-muted'}"
									>
										{item.description}
									</span>
								</button>
							</li>
						{/each}
					{/each}
				</ul>
			{/if}

			<div
				class="flex items-center justify-between gap-2 border-t border-border px-3 py-2 text-xs text-muted"
			>
				<span>↑↓ navigate · Enter open · Esc close</span>
				<span class="hidden sm:inline">Ctrl/⌘ K</span>
			</div>
		</div>
	</div>
{/if}
