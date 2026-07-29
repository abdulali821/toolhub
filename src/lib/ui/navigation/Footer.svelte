<script lang="ts">
	import { resolve } from '$app/paths';
	import Container from '$ui/layout/Container.svelte';

	type Props = {
		brand?: string;
	};

	let { brand = 'HeyTools' }: Props = $props();
	const year = new Date().getFullYear();
</script>

<footer class="mt-auto border-t border-border bg-bg py-12">
	<Container class="flex flex-col items-center justify-between gap-6 md:flex-row">
		<a href={resolve('/')} class="flex items-center gap-2 no-underline">
			<span
				class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-900"
				aria-hidden="true"
			>
				<img src="/logo-1.png" alt="" width="20" height="20" class="object-cover" />
			</span>
			<span class="font-display text-lg font-semibold tracking-tight text-fg">{brand}</span>
		</a>

		<p class="text-sm text-muted">&copy; {year} {brand}. Premium Browser Tools.</p>

		<nav aria-label="Legal" class="flex gap-6 text-sm font-medium text-muted">
			<a href={resolve('/privacy')} class="no-underline transition-colors hover:text-fg">Privacy</a>
			<a href={resolve('/request-tool')} class="no-underline transition-colors hover:text-fg"
				>Request a tool</a
			>
		</nav>
	</Container>
</footer>
