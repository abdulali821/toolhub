import { getContext, setContext } from 'svelte';

const KEY = Symbol('toolhub.tool-shell');

export type ToolShellActions = {
	/** Value used by the Copy action. */
	copyValue?: string;
	/** Filename for Download (requires copyValue or downloadValue). */
	downloadFilename?: string;
	downloadMime?: string;
	downloadValue?: string;
	/** Called when Reset is clicked. */
	onReset?: () => void;
};

export type ToolShellContext = {
	getActions: () => ToolShellActions;
	setActions: (actions: ToolShellActions) => void;
};

export function setToolShellContext(ctx: ToolShellContext): void {
	setContext(KEY, ctx);
}

export function getToolShellContext(): ToolShellContext | undefined {
	return getContext<ToolShellContext | undefined>(KEY);
}

/** Register shell actions from a tool UI (Copy / Download / Reset payloads). */
export function setToolShellActions(actions: ToolShellActions): void {
	getToolShellContext()?.setActions(actions);
}
