<script lang="ts">
	import { resolve } from '$app/paths';
	import Container from '$ui/layout/Container.svelte';

	type Props = {
		brand?: string;
	};

	let { brand = 'ToolHub' }: Props = $props();
	const year = new Date().getFullYear();

	const links = [
		{ href: '/tools' as const, label: 'All tools' },
		{ href: '/categories' as const, label: 'Categories' },
		{ href: '/search' as const, label: 'Search' },
		{ href: '/login' as const, label: 'Sign in' }
	];
</script>

<footer class="mt-auto border-t border-border bg-bg-elevated/40">
	<Container class="grid gap-10 py-12 sm:grid-cols-[1.4fr_1fr]">
		<div>
			<p class="font-display text-2xl font-semibold tracking-tight text-fg">{brand}</p>
			<p class="mt-2 max-w-sm text-sm text-pretty text-muted">
				Privacy-first tools that run in your browser. No installs. No clutter.
			</p>
		</div>
		<nav aria-label="Footer">
			<p class="text-xs font-semibold tracking-wide text-muted uppercase">Explore</p>
			<ul class="mt-3 grid gap-2 text-sm">
				{#each links as link (link.href)}
					<li>
						<a
							href={resolve(link.href)}
							class="text-fg no-underline transition-colors hover:text-accent">{link.label}</a
						>
					</li>
				{/each}
			</ul>
		</nav>
	</Container>
	<Container class="border-t border-border py-5 text-sm text-muted">
		<p>&copy; {year} {brand}. Free for everyone.</p>
	</Container>
</footer>
