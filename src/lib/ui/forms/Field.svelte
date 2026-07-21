<script lang="ts">
	import type { Snippet } from 'svelte';
	import { setFieldContext } from './field-context';

	type Props = {
		id: string;
		label: string;
		hint?: string;
		error?: string;
		required?: boolean;
		children: Snippet;
	};

	let { id, label, hint, error, required = false, children }: Props = $props();

	const describedBy = $derived(error ? `${id}-error` : hint ? `${id}-hint` : undefined);

	setFieldContext({
		getDescribedBy: () => describedBy
	});
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class="text-sm font-medium text-fg">
		{label}
		{#if required}
			<span class="text-danger" aria-hidden="true">*</span>
		{/if}
	</label>

	{@render children()}

	{#if error}
		<p id="{id}-error" class="text-sm text-danger" role="alert">{error}</p>
	{:else if hint}
		<p id="{id}-hint" class="text-sm text-muted">{hint}</p>
	{/if}
</div>
