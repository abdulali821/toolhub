<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme, setTheme, type Theme } from '$lib/utils/theme';

	let theme = $state<Theme>('light');

	onMount(() => {
		theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
		applyTheme(theme);
	});

	function onToggle() {
		const next: Theme = theme === 'dark' ? 'light' : 'dark';
		setTheme(next);
		theme = next;
	}
</script>

<button
	type="button"
	class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-bg hover:text-fg"
	aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
	aria-pressed={theme === 'dark'}
	onclick={onToggle}
>
	{#if theme === 'dark'}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.75" />
			<path
				d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linecap="round"
			/>
		</svg>
	{:else}
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
				stroke="currentColor"
				stroke-width="1.75"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
</button>
