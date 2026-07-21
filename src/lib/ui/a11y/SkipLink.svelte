<script lang="ts">
	type Props = {
		href?: string;
		label?: string;
	};

	let { href = '#main', label = 'Skip to content' }: Props = $props();
</script>

<a
	{href}
	class="sr-only bg-accent text-accent-fg focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:ring-2 focus:ring-focus"
>
	{label}
</a>
