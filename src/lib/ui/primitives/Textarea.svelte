<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { getFieldDescribedBy } from '../forms/field-context';

	type Props = HTMLTextareaAttributes & {
		invalid?: boolean;
	};

	let {
		class: className = '',
		invalid = false,
		value = $bindable(''),
		rows = 4,
		'aria-describedby': ariaDescribedBy,
		...rest
	}: Props = $props();

	const fieldDescribedBy = $derived(getFieldDescribedBy());
	const describedBy = $derived(
		[fieldDescribedBy, ariaDescribedBy].filter(Boolean).join(' ') || undefined
	);
</script>

<textarea
	{rows}
	bind:value
	aria-invalid={invalid || undefined}
	aria-describedby={describedBy}
	class="w-full rounded-md border bg-bg px-3 py-2 text-fg transition-colors duration-150 placeholder:text-muted focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:opacity-50 {invalid
		? 'border-danger'
		: 'border-border'} {className}"
	{...rest}></textarea>
