<script lang="ts">
	type Props = {
		steps: string[];
		title?: string;
	};

	let { steps, title = 'How to use' }: Props = $props();
</script>

<section aria-labelledby="tool-howto-heading">
	<h2 id="tool-howto-heading" class="font-display text-2xl font-semibold tracking-tight">
		{title}
	</h2>
	<ol class="mt-6 list-decimal space-y-2 ps-5 text-muted">
		{#each steps as step, i (i)}
			<li class="ps-1 text-pretty text-fg">{step}</li>
		{/each}
	</ol>
</section>
