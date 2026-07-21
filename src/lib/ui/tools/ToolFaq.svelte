<script lang="ts">
	import type { FaqItem } from '$engine/types';

	type Props = {
		items: FaqItem[];
		title?: string;
	};

	let { items, title = 'Frequently asked questions' }: Props = $props();
</script>

<section aria-labelledby="tool-faq-heading">
	<h2 id="tool-faq-heading" class="font-display text-2xl font-semibold tracking-tight">{title}</h2>
	<div class="mt-6 space-y-3">
		{#each items as item (item.question)}
			<details class="group rounded-md border border-border bg-bg-elevated px-4 py-3">
				<summary class="cursor-pointer font-medium text-fg">{item.question}</summary>
				<p class="mt-2 text-sm text-pretty text-muted">{item.answer}</p>
			</details>
		{/each}
	</div>
</section>
