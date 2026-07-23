<script lang="ts">
	import { resolve } from '$app/paths';
	import Container from '$ui/layout/Container.svelte';

	type Props = {
		brand?: string;
	};

	let { brand = 'HeyTools' }: Props = $props();
	const year = new Date().getFullYear();
</script>

<footer class="mt-auto border-t border-gray-100 bg-gray-50 py-12">
	<Container class="flex flex-col items-center justify-between gap-6 md:flex-row">
		<a href={resolve('/')} class="flex items-center gap-2 no-underline">
			<span
				class="flex h-6 w-6 items-center justify-center rounded bg-gray-900 text-white"
				aria-hidden="true"
			>
				<span class="font-display text-xs leading-none font-bold">H</span>
			</span>
			<span class="font-display text-lg font-semibold tracking-tight text-gray-900">{brand}</span>
		</a>

		<p class="text-sm text-gray-500">&copy; {year} {brand}. Premium Browser Tools.</p>

		<nav aria-label="Legal" class="flex gap-6 text-sm font-medium text-gray-500">
			<a href={resolve('/privacy')} class="no-underline transition-colors hover:text-gray-900"
				>Privacy</a
			>
			<a href={resolve('/request-tool')} class="no-underline transition-colors hover:text-gray-900"
				>Request a tool</a
			>
		</nav>
	</Container>
</footer>
