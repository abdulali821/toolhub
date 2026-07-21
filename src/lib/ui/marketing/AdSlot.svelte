<script lang="ts">
	type Props = {
		placement?: 'header' | 'sidebar' | 'footer' | 'in-content';
		enabled?: boolean;
		label?: string;
		class?: string;
	};

	let {
		placement = 'in-content',
		enabled = false,
		label = 'Advertisement',
		class: className = ''
	}: Props = $props();
</script>

{#if enabled}
	<aside
		class="ad-slot border border-dashed border-border bg-bg-elevated/60 px-4 py-6 text-center {className}"
		data-ad-slot={placement}
		aria-label={label}
	>
		<p class="text-xs tracking-wide text-muted uppercase">{label}</p>
		<!-- Network creatives inject here when PUBLIC_ADS_ENABLED=true and a provider is wired. -->
		<div class="mx-auto mt-2 flex min-h-16 max-w-md items-center justify-center text-sm text-muted">
			Ad slot ({placement})
		</div>
	</aside>
{/if}
