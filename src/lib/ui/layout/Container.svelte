<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		as?: 'div' | 'section' | 'main' | 'article';
		class?: string;
		id?: string;
		'aria-labelledby'?: string;
	};

	let {
		children,
		class: className = '',
		as = 'div',
		id,
		'aria-labelledby': ariaLabelledby
	}: Props = $props();
</script>

{#if as === 'section'}
	<section
		{id}
		aria-labelledby={ariaLabelledby}
		class="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-6 lg:px-8 {className}"
	>
		{@render children()}
	</section>
{:else if as === 'main'}
	<main
		{id}
		aria-labelledby={ariaLabelledby}
		class="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-6 lg:px-8 {className}"
	>
		{@render children()}
	</main>
{:else if as === 'article'}
	<article
		{id}
		aria-labelledby={ariaLabelledby}
		class="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-6 lg:px-8 {className}"
	>
		{@render children()}
	</article>
{:else}
	<div
		{id}
		aria-labelledby={ariaLabelledby}
		class="mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-6 lg:px-8 {className}"
	>
		{@render children()}
	</div>
{/if}
