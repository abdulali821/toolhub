<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Container from '$ui/layout/Container.svelte';
	import { openCommandPalette } from './command-palette-state';
	import { listTools } from '$tools';
	import type { CategoryId } from '$lib/config/site';

	type NavLink = {
		href: string;
		label: string;
		match?: 'exact';
		category?: CategoryId;
	};

	type Props = {
		brand?: string;
		links?: NavLink[];
		user?: { id: string; email?: string } | null;
	};

	let {
		brand = 'ToolHub',
		links = [
			{ href: '/tools', label: 'All Tools', match: 'exact' },
			{ href: '/tools?category=developer', label: 'Developer Tools', category: 'developer' },
			{ href: '/tools?category=text', label: 'Text Tools', category: 'text' },
			{ href: '/tools?category=data', label: 'Data Tools', category: 'data' },
			{ href: '/tools?category=image', label: 'Image Tools', category: 'image' },
			{ href: '/tools?category=generators', label: 'Generators', category: 'generators' },
			{ href: '/search', label: 'Search', match: 'exact' }
		],
		user = null
	}: Props = $props();

	const catalog = listTools();
	const popularIds = [
		'json-formatter',
		'password-generator',
		'word-counter',
		'base64-codec',
		'color-converter',
		'regex-tester'
	] as const;

	let open = $state(false);
	let accountOpen = $state(false);
	let openMenu = $state<string | null>(null);
	let closeTimer: ReturnType<typeof setTimeout> | undefined;
	let modKey = $state('Ctrl');

	onMount(() => {
		modKey = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl';
	});

	$effect(() => {
		void page.url.pathname;
		void page.url.search;
		open = false;
		accountOpen = false;
		openMenu = null;
	});

	function hrefFor(href: string) {
		const [path, qs] = href.split('?');
		const base = resolve((path || '/') as '/');
		return qs ? `${base}?${qs}` : base;
	}

	function isActive(link: NavLink) {
		const [linkPath, qs] = link.href.split('?');
		if (page.url.pathname !== linkPath) return false;

		if (linkPath === '/search') return true;

		const currentCategory = page.url.searchParams.get('category');
		if (link.match === 'exact' || !qs) {
			return !currentCategory;
		}

		const wanted = new URLSearchParams(qs).get('category');
		return Boolean(wanted) && wanted === currentCategory;
	}

	function toolsFor(link: NavLink) {
		if (link.category) {
			return catalog.filter((t) => t.category === link.category).slice(0, 10);
		}
		if (link.href === '/tools') {
			return popularIds
				.map((id) => catalog.find((t) => t.id === id))
				.filter((t): t is NonNullable<typeof t> => t != null);
		}
		return [];
	}

	function openDropdown(id: string) {
		clearTimeout(closeTimer);
		openMenu = id;
	}

	function scheduleClose() {
		clearTimeout(closeTimer);
		closeTimer = setTimeout(() => {
			openMenu = null;
		}, 140);
	}

	const initials = $derived.by(() => {
		const email = user?.email?.trim();
		if (!email) return '?';
		const local = email.split('@')[0] ?? email;
		const parts = local.split(/[._-]+/).filter(Boolean);
		if (parts.length >= 2) {
			return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
		}
		return local.slice(0, 2).toUpperCase();
	});

	function onDocClick(event: MouseEvent) {
		const target = event.target as HTMLElement | null;
		if (!target?.closest('[data-menu="account"]')) accountOpen = false;
	}
</script>

<svelte:window onclick={onDocClick} />

<header
	class="fixed top-0 right-0 left-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md"
>
	<Container class="relative flex h-16 items-center justify-between gap-4">
		<a href={resolve('/')} class="flex shrink-0 items-center gap-2 no-underline">
			<span
				class="flex h-8 w-8 items-center justify-center rounded bg-gray-900 text-white"
				aria-hidden="true"
			>
				<span class="font-display text-lg leading-none font-bold">T</span>
			</span>
			<span class="font-display text-xl font-semibold tracking-tight text-gray-900">{brand}</span>
		</a>

		<nav
			aria-label="Primary"
			class="no-scrollbar mx-2 hidden min-w-0 flex-1 justify-center xl:flex"
		>
			<ul class="flex items-center gap-1 text-sm font-medium whitespace-nowrap text-gray-500">
				{#each links as link (link.href)}
					{@const active = isActive(link)}
					{@const items = toolsFor(link)}
					{@const hasMenu = items.length > 0}
					<li
						class="relative"
						onmouseenter={() => (hasMenu ? openDropdown(link.href) : (openMenu = null))}
						onmouseleave={scheduleClose}
					>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefFor uses resolve -->
						<a
							href={hrefFor(link.href)}
							aria-current={active ? 'page' : undefined}
							aria-haspopup={hasMenu ? 'true' : undefined}
							aria-expanded={hasMenu && openMenu === link.href ? 'true' : undefined}
							class="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 transition-colors {active
								? 'text-gray-900'
								: 'hover:text-gray-900'}"
						>
							{link.label}
							{#if hasMenu}
								<svg
									width="10"
									height="10"
									viewBox="0 0 24 24"
									fill="none"
									aria-hidden="true"
									class="opacity-50"
								>
									<path
										d="M6 9l6 6 6-6"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							{/if}
						</a>

						{#if hasMenu && openMenu === link.href}
							<div class="nav-dropdown absolute top-full left-1/2 z-40 w-72 -translate-x-1/2 pt-3">
								<div
									class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-premium-hover"
								>
									<div class="border-b border-gray-100 px-4 py-3">
										<p class="text-xs font-semibold tracking-wider text-gray-400 uppercase">
											{link.href === '/tools' ? 'Popular tools' : link.label}
										</p>
									</div>
									<ul class="max-h-80 overflow-y-auto p-2">
										{#each items as tool (tool.id)}
											<li>
												<a
													href={resolve(`/tools/${tool.id}`)}
													class="block rounded-xl px-3 py-2.5 no-underline transition-colors hover:bg-gray-50"
												>
													<span class="block text-sm font-medium text-gray-900">{tool.name}</span>
													<span class="mt-0.5 line-clamp-1 block text-xs text-gray-500"
														>{tool.description}</span
													>
												</a>
											</li>
										{/each}
									</ul>
									<div class="border-t border-gray-100 p-2">
										<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefFor uses resolve -->
										<a
											href={hrefFor(link.href)}
											class="block rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 no-underline hover:bg-gray-50"
										>
											View all →
										</a>
									</div>
								</div>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</nav>

		<div class="flex shrink-0 items-center gap-2">
			<button
				type="button"
				class="hidden h-10 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 pr-2 pl-3 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:bg-white hover:text-gray-900 sm:inline-flex"
				onclick={() => openCommandPalette()}
				aria-label="Open search"
				aria-keyshortcuts="Control+K Meta+K"
			>
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.75" />
					<path
						d="M20 20l-3.5-3.5"
						stroke="currentColor"
						stroke-width="1.75"
						stroke-linecap="round"
					/>
				</svg>
				<span class="hidden md:inline">Search</span>
				<kbd
					class="rounded-md border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-gray-400"
					>{modKey} K</kbd
				>
			</button>

			<button
				type="button"
				class="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:hidden"
				onclick={() => openCommandPalette()}
				aria-label="Open search"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.75" />
					<path
						d="M20 20l-3.5-3.5"
						stroke="currentColor"
						stroke-width="1.75"
						stroke-linecap="round"
					/>
				</svg>
			</button>

			{#if user}
				<div class="relative" data-menu="account">
					<button
						type="button"
						class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white transition-opacity hover:opacity-90"
						aria-expanded={accountOpen}
						aria-haspopup="menu"
						aria-label="Account menu"
						onclick={(e) => {
							e.stopPropagation();
							accountOpen = !accountOpen;
						}}
					>
						{initials}
					</button>
					{#if accountOpen}
						<div
							class="absolute top-full right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-premium-hover"
							role="menu"
						>
							<p class="truncate px-3 py-2 text-xs text-gray-500">{user.email}</p>
							<a
								href={resolve('/account')}
								role="menuitem"
								class="block rounded-lg px-3 py-2 text-sm text-gray-900 no-underline hover:bg-gray-50"
								>Account</a
							>
							<form method="POST" action={resolve('/logout')}>
								<button
									type="submit"
									role="menuitem"
									class="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-50"
								>
									Sign out
								</button>
							</form>
						</div>
					{/if}
				</div>
			{:else}
				<a
					href={resolve('/login')}
					class="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 no-underline transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
					aria-label="Sign in"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.75" />
						<path
							d="M5 19c1.5-3 4-4.5 7-4.5s5.5 1.5 7 4.5"
							stroke="currentColor"
							stroke-width="1.75"
							stroke-linecap="round"
						/>
					</svg>
				</a>
			{/if}

			<button
				type="button"
				class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-900 xl:hidden"
				aria-expanded={open}
				aria-controls="mobile-nav"
				onclick={() => (open = !open)}
			>
				<span class="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
				{#if open}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path
							d="M6 6l12 12M18 6L6 18"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				{:else}
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path
							d="M4 7h16M4 12h16M4 17h16"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
				{/if}
			</button>
		</div>
	</Container>

	{#if open}
		<nav
			id="mobile-nav"
			aria-label="Mobile"
			class="animate-fade max-h-[70vh] overflow-y-auto border-t border-gray-100 bg-white xl:hidden"
		>
			<Container class="flex flex-col gap-1 py-3">
				{#each links as link (link.href)}
					{@const active = isActive(link)}
					{@const items = toolsFor(link)}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefFor uses resolve -->
					<a
						href={hrefFor(link.href)}
						aria-current={active ? 'page' : undefined}
						class="rounded-lg px-3 py-2.5 text-sm font-medium no-underline {active
							? 'bg-gray-50 text-gray-900'
							: 'text-gray-900 hover:bg-gray-50'}">{link.label}</a
					>
					{#if items.length && link.category}
						<ul class="mb-2 ml-2 space-y-0.5 border-l border-gray-100 pl-3">
							{#each items.slice(0, 5) as tool (tool.id)}
								<li>
									<a
										href={resolve(`/tools/${tool.id}`)}
										class="block rounded-md px-2 py-1.5 text-xs text-gray-500 no-underline hover:bg-gray-50 hover:text-gray-900"
										>{tool.name}</a
									>
								</li>
							{/each}
						</ul>
					{/if}
				{/each}
			</Container>
		</nav>
	{/if}
</header>
<div class="h-16" aria-hidden="true"></div>

<style>
	.nav-dropdown {
		animation: nav-dropdown-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes nav-dropdown-in {
		from {
			opacity: 0;
			transform: translate(-50%, -6px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-dropdown {
			animation: none;
		}
	}
</style>
