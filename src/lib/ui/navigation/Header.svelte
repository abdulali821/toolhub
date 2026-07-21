<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Container from '$ui/layout/Container.svelte';
	import { openCommandPalette } from './command-palette-state';

	type NavLink = { href: '/tools' | '/categories' | '/search' | '/account'; label: string };

	type Props = {
		brand?: string;
		links?: NavLink[];
		user?: { id: string; email?: string } | null;
	};

	let {
		brand = 'ToolHub',
		links = [
			{ href: '/tools', label: 'Tools' },
			{ href: '/categories', label: 'Categories' },
			{ href: '/search', label: 'Search' }
		],
		user = null
	}: Props = $props();

	let open = $state(false);

	$effect(() => {
		void page.url.pathname;
		open = false;
	});

	function isActive(href: string) {
		const path = page.url.pathname;
		if (href === '/') return path === '/';
		return path === href || path.startsWith(`${href}/`);
	}
</script>

<header
	class="sticky top-0 z-40 border-b border-border/80 bg-bg-elevated/80 backdrop-blur-xl transition-[border-color,background-color] duration-[var(--duration-base)]"
>
	<Container class="flex h-14 items-center justify-between gap-4 sm:h-16">
		<a
			href={resolve('/')}
			class="font-display text-xl font-semibold tracking-tight text-fg no-underline transition-opacity hover:opacity-80 sm:text-2xl"
		>
			{brand}
		</a>

		<nav aria-label="Primary" class="hidden items-center gap-1 md:flex">
			<ul class="flex items-center gap-1 text-sm font-medium">
				{#each links as link (link.href)}
					{@const active = isActive(link.href)}
					<li>
						<a
							href={resolve(link.href)}
							aria-current={active ? 'page' : undefined}
							class="rounded-md px-3 py-2 transition-[color,background-color] duration-[var(--duration-fast)] {active
								? 'bg-bg text-fg shadow-sm ring-1 ring-border/80'
								: 'text-muted hover:bg-bg hover:text-fg'}">{link.label}</a
						>
					</li>
				{/each}
			</ul>
			<div class="ml-3 flex items-center gap-2 border-l border-border pl-3">
				<button
					type="button"
					class="pressable inline-flex h-9 items-center gap-2 rounded-md border border-border bg-bg/50 px-2.5 text-xs font-medium text-muted transition-colors hover:border-accent/35 hover:bg-bg hover:text-fg"
					onclick={() => openCommandPalette()}
					aria-keyshortcuts="Control+K Meta+K"
				>
					<span>Search</span>
					<kbd
						class="rounded border border-border bg-bg px-1.5 py-0.5 font-mono text-[10px] text-muted"
						>Ctrl K</kbd
					>
				</button>
				{#if user}
					<a
						href={resolve('/account')}
						aria-current={isActive('/account') ? 'page' : undefined}
						class="rounded-md px-3 py-2 text-sm font-medium transition-colors {isActive('/account')
							? 'bg-bg text-fg'
							: 'text-muted hover:bg-bg hover:text-fg'}"
					>
						Account
					</a>
					<form method="POST" action={resolve('/logout')}>
						<button
							type="submit"
							class="pressable rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-bg hover:text-fg"
						>
							Sign out
						</button>
					</form>
				{:else}
					<a
						href={resolve('/login')}
						class="pressable rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-fg no-underline transition-colors hover:bg-accent-hover"
					>
						Sign in
					</a>
				{/if}
			</div>
		</nav>

		<div class="flex items-center gap-2 md:hidden">
			<button
				type="button"
				class="pressable inline-flex h-10 items-center rounded-md border border-border px-3 text-sm text-fg transition-colors hover:border-accent/35"
				onclick={() => openCommandPalette()}
			>
				Search
			</button>
			<button
				type="button"
				class="pressable inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-fg transition-colors hover:border-accent/35"
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
			class="animate-fade border-t border-border bg-bg-elevated md:hidden"
		>
			<Container class="flex flex-col gap-1 py-3">
				{#each links as link (link.href)}
					{@const active = isActive(link.href)}
					<a
						href={resolve(link.href)}
						aria-current={active ? 'page' : undefined}
						class="rounded-md px-3 py-2.5 text-sm font-medium no-underline transition-colors {active
							? 'bg-bg text-fg'
							: 'text-fg hover:bg-bg'}">{link.label}</a
					>
				{/each}
				{#if user}
					<a
						href={resolve('/account')}
						class="rounded-md px-3 py-2.5 text-sm font-medium text-fg no-underline hover:bg-bg"
						>Account</a
					>
					<form method="POST" action={resolve('/logout')}>
						<button
							type="submit"
							class="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted hover:bg-bg"
						>
							Sign out
						</button>
					</form>
				{:else}
					<a
						href={resolve('/login')}
						class="mt-1 rounded-md bg-accent px-3 py-2.5 text-center text-sm font-medium text-accent-fg no-underline"
						>Sign in</a
					>
				{/if}
			</Container>
		</nav>
	{/if}
</header>
