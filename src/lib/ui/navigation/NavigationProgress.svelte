<script lang="ts">
	import { navigating } from '$app/state';

	const active = $derived(Boolean(navigating.to));
</script>

{#if active}
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5 overflow-hidden bg-transparent"
		role="progressbar"
		aria-label="Loading page"
		aria-busy="true"
	>
		<div class="nav-progress-bar h-full bg-gray-900"></div>
	</div>
{/if}

<style>
	.nav-progress-bar {
		width: 100%;
		transform-origin: left center;
		animation: nav-progress 1.1s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
	}

	@keyframes nav-progress {
		0% {
			transform: scaleX(0.08);
			opacity: 1;
		}
		40% {
			transform: scaleX(0.55);
		}
		70% {
			transform: scaleX(0.78);
		}
		100% {
			transform: scaleX(0.92);
			opacity: 0.85;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-progress-bar {
			animation: none;
			transform: scaleX(0.65);
		}
	}
</style>
