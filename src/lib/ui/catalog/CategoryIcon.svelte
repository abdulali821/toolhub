<script lang="ts">
	import type { CategoryIconKind } from './category-meta';

	type Props = {
		kind: CategoryIconKind;
		size?: number;
		class?: string;
	};

	let { kind, size = 18, class: className = '' }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	aria-hidden="true"
	class={className}
>
	{#if kind === 'code'}
		<path
			d="M8 7L3 12l5 5M16 7l5 5-5 5M14 4l-4 16"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else if kind === 'type'}
		<path
			d="M5 19h14M9 15V7.5A1.5 1.5 0 0 1 10.5 6h3A1.5 1.5 0 0 1 15 7.5V15M9 10h6"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else if kind === 'braces'}
		<path
			d="M8 5H7a2 2 0 0 0-2 2v3.5a1.5 1.5 0 0 1-1.5 1.5A1.5 1.5 0 0 1 5 13.5V17a2 2 0 0 0 2 2h1M16 5h1a2 2 0 0 1 2 2v3.5a1.5 1.5 0 0 0 1.5 1.5A1.5 1.5 0 0 0 19 13.5V17a2 2 0 0 1-2 2h-1"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else if kind === 'image'}
		<path
			d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linejoin="round"
		/>
		<path
			d="M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4.5 16.5l4.5-4.5 3 3 3.5-4.5 4 6"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else if kind === 'pdf'}
		<path
			d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linejoin="round"
		/>
		<path
			d="M14 3v5h5M8.5 16.5c.6-2.2 1.4-3.2 3.5-3.5 1.6-.2 2.2.8 2 2.2-.3 1.8-2.2 2.3-3.5 1.5"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else if kind === 'palette'}
		<path
			d="M12 3a9 9 0 1 0 0 18h1.2a2.3 2.3 0 0 0 2.1-3.3 2.3 2.3 0 0 1 2-3.5H18a4 4 0 0 0 0-8h-.5"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path
			d="M8 10.5h.01M11 8h.01M15.5 9h.01"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
		/>
	{:else if kind === 'encode'}
		<path
			d="M5 8h6M5 12h4M5 16h6M15 8l4 4-4 4"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else if kind === 'swap'}
		<path
			d="M7 8h11M15 5l3 3-3 3M17 16H6M9 13l-3 3 3 3"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else if kind === 'spark'}
		<path
			d="M12 3v3M12 18v3M3 12h3M18 12h3M6.2 6.2l2.1 2.1M15.7 15.7l2.1 2.1M17.8 6.2l-2.1 2.1M8.3 15.7l-2.1 2.1"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
		/>
		<circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.75" />
	{:else}
		<path
			d="M7 4h2v16H7zM15 4h2v16h-2zM5 8h6M13 16h6"
			stroke="currentColor"
			stroke-width="1.75"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{/if}
</svg>
