<script lang="ts">
	import type { AnalyticsConfig } from '$lib/analytics/provider';

	type Props = {
		config: AnalyticsConfig;
	};

	let { config }: Props = $props();
</script>

{#if config.provider === 'plausible' && config.domain}
	<script defer data-domain={config.domain} src="https://plausible.io/js/script.js"></script>
{:else if config.provider === 'simple' && config.domain}
	<script async defer src="https://scripts.simpleanalyticscdn.com/latest.js"></script>
	<noscript>
		<img
			src="https://queue.simpleanalyticscdn.com/noscript.gif"
			alt=""
			referrerpolicy="no-referrer-when-downgrade"
		/>
	</noscript>
{/if}
