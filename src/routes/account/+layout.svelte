<script lang="ts">
	import { resolve } from '$app/paths';
	import { Container } from '$ui';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const links = [
		{ href: '/account' as const, label: 'Overview' },
		{ href: '/account/favorites' as const, label: 'Favorites' },
		{ href: '/account/history' as const, label: 'History' }
	];
</script>

<main id="main">
	<Container class="py-12">
		<header class="mb-8">
			<p class="text-sm text-muted">Signed in as</p>
			<h1 class="font-display text-3xl font-semibold tracking-tight">{data.email}</h1>
		</header>

		<nav aria-label="Account" class="mb-8 flex flex-wrap gap-3 border-b border-border pb-4 text-sm">
			{#each links as link (link.href)}
				<a href={resolve(link.href)} class="font-medium text-muted no-underline hover:text-fg">
					{link.label}
				</a>
			{/each}
		</nav>

		{@render children()}
	</Container>
</main>
