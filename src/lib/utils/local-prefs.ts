const PREFIX = 'toolhub';

function key(toolId: string, name: string) {
	return `${PREFIX}:${toolId}:${name}`;
}

function canUseStorage() {
	return typeof localStorage !== 'undefined';
}

/** Read a namespaced preference for a tool. Returns null if missing or unavailable. */
export function getLocalPref(toolId: string, name: string): string | null {
	if (!canUseStorage()) return null;
	try {
		return localStorage.getItem(key(toolId, name));
	} catch {
		return null;
	}
}

/** Persist a namespaced preference for a tool. */
export function setLocalPref(toolId: string, name: string, value: string): void {
	if (!canUseStorage()) return;
	try {
		localStorage.setItem(key(toolId, name), value);
	} catch {
		// Quota exceeded or private mode — fail silently
	}
}

/** Remove a namespaced preference for a tool. */
export function removeLocalPref(toolId: string, name: string): void {
	if (!canUseStorage()) return;
	try {
		localStorage.removeItem(key(toolId, name));
	} catch {
		// ignore
	}
}

/** Read JSON from a namespaced preference. Returns null on parse failure. */
export function getLocalPrefJson<T>(toolId: string, name: string): T | null {
	const raw = getLocalPref(toolId, name);
	if (raw == null) return null;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return null;
	}
}

/** Persist JSON as a namespaced preference. */
export function setLocalPrefJson(toolId: string, name: string, value: unknown): void {
	setLocalPref(toolId, name, JSON.stringify(value));
}
