<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import Container from '$ui/layout/Container.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import { openCommandPalette } from './command-palette-state';
	import { listTools } from '$tools';
	import { site, type CategoryId } from '$lib/config/site';

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
		brand = 'HeyTools',
		links = [
			{ href: '/tools', label: 'All Tools', match: 'exact' },
			{ href: '/categories/developer', label: 'Developer Tools', category: 'developer' },
			{ href: '/categories/text', label: 'Text Tools', category: 'text' },
			{ href: '/categories/data', label: 'Data Tools', category: 'data' },
			{ href: '/categories/image', label: 'Image Tools', category: 'image' },
			{ href: '/categories/generators', label: 'Generators', category: 'generators' }
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
	class="fixed top-0 right-0 left-0 z-50 border-b border-border bg-bg-elevated/80 backdrop-blur-md"
>
	<Container class="relative flex h-16 items-center justify-between gap-4">
		<a href={resolve('/')} class="flex shrink-0 items-center gap-2 no-underline">
			<span
				class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-900"
				aria-hidden="true"
			>
				<img src="/logo-1.png" alt="" width="22" height="22" class=" object-cover" />
			</span>
			<span class="font-display text-xl font-semibold tracking-tight text-fg">{brand}</span>
		</a>

		<nav
			aria-label="Primary"
			class="no-scrollbar mx-2 hidden min-w-0 flex-1 justify-center xl:flex"
		>
			<ul class="flex items-center gap-1 text-sm font-medium whitespace-nowrap text-muted">
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
								? 'text-fg'
								: 'hover:text-fg'}"
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
									class="overflow-hidden rounded-2xl border border-border bg-bg-elevated shadow-premium-hover"
								>
									<div class="border-b border-border px-4 py-3">
										<p class="text-xs font-semibold tracking-wider text-muted uppercase">
											{link.href === '/tools' ? 'Popular tools' : link.label}
										</p>
									</div>
									<ul class="max-h-80 overflow-y-auto p-2">
										{#each items as tool (tool.id)}
											<li>
												<a
													href={resolve(`/tools/${tool.id}`)}
													class="block rounded-xl px-3 py-2.5 no-underline transition-colors hover:bg-bg"
												>
													<span class="block text-sm font-medium text-fg">{tool.name}</span>
													<span class="mt-0.5 line-clamp-1 block text-xs text-muted"
														>{tool.description}</span
													>
												</a>
											</li>
										{/each}
									</ul>
									<div class="border-t border-border p-2">
										<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- hrefFor uses resolve -->
										<a
											href={hrefFor(link.href)}
											class="block rounded-xl px-3 py-2.5 text-sm font-medium text-fg no-underline hover:bg-bg"
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
			<a
				href={site.links.github}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-fg"
				aria-label="GitHub repository — contribute tools"
				title="Contribute on GitHub"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
					/>
				</svg>
			</a>
			<a
				href={site.links.discord}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-fg"
				aria-label="Join Discord community"
				title="Join Discord"
			>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path
						d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
					/>
				</svg>
			</a>

			<button
				type="button"
				class="hidden h-10 items-center gap-2 rounded-full border border-border bg-bg pr-2 pl-3 text-sm text-muted transition-colors hover:border-border hover:bg-bg-elevated hover:text-fg sm:inline-flex"
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
					class="rounded-md border border-border bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-muted"
					>{modKey} K</kbd
				>
			</button>

			<button
				type="button"
				class="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-bg hover:text-fg sm:hidden"
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

			<ThemeToggle />

			{#if user}
				<div class="relative" data-menu="account">
					<button
						type="button"
						class="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-fg transition-opacity hover:opacity-90"
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
							class="absolute top-full right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-bg-elevated p-1.5 shadow-premium-hover"
							role="menu"
						>
							<p class="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
							<a
								href={resolve('/account')}
								role="menuitem"
								class="block rounded-lg px-3 py-2 text-sm text-fg no-underline hover:bg-bg"
								>Account</a
							>
							<form method="POST" action={resolve('/logout')}>
								<button
									type="submit"
									role="menuitem"
									class="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-bg"
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
					class="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted no-underline transition-colors hover:border-border hover:bg-bg hover:text-fg"
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
				class="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-fg xl:hidden"
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
			class="animate-fade max-h-[70vh] overflow-y-auto border-t border-border bg-bg-elevated xl:hidden"
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
							? 'bg-bg text-fg'
							: 'text-fg hover:bg-bg'}">{link.label}</a
					>
					{#if items.length && link.category}
						<ul class="mb-2 ml-2 space-y-0.5 border-l border-border pl-3">
							{#each items.slice(0, 5) as tool (tool.id)}
								<li>
									<a
										href={resolve(`/tools/${tool.id}`)}
										class="block rounded-md px-2 py-1.5 text-xs text-muted no-underline hover:bg-bg hover:text-fg"
										>{tool.name}</a
									>
								</li>
							{/each}
						</ul>
					{/if}
				{/each}
				<div class="mt-2 border-t border-border pt-2">
					<a
						href={site.links.github}
						target="_blank"
						rel="noopener noreferrer"
						class="block rounded-lg px-3 py-2.5 text-sm font-medium text-fg no-underline hover:bg-bg"
						>GitHub — contribute</a
					>
					<a
						href={site.links.discord}
						target="_blank"
						rel="noopener noreferrer"
						class="block rounded-lg px-3 py-2.5 text-sm font-medium text-fg no-underline hover:bg-bg"
						>Discord community</a
					>
				</div>
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
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-dropdown {
			animation: none;
		}
	}
</style>
