export type FileConstraints = {
	maxBytes: number;
	accept?: string;
	mimeAllowlist?: string[];
	extensions?: string[];
};

export type FileValidationResult = { ok: true; file: File } | { ok: false; error: string };

export function validateFile(file: File, constraints: FileConstraints): FileValidationResult {
	if (file.size > constraints.maxBytes) {
		return {
			ok: false,
			error: `File is too large (max ${Math.round(constraints.maxBytes / (1024 * 1024))} MB).`
		};
	}

	if (constraints.mimeAllowlist?.length) {
		const mimeOk =
			constraints.mimeAllowlist.includes(file.type) ||
			(file.type === '' && Boolean(constraints.extensions?.length));
		if (!mimeOk && file.type) {
			return { ok: false, error: `Unsupported file type: ${file.type || 'unknown'}` };
		}
	}

	if (constraints.extensions?.length) {
		const name = file.name.toLowerCase();
		const ok = constraints.extensions.some((ext) => name.endsWith(ext.toLowerCase()));
		if (!ok) {
			return {
				ok: false,
				error: `Allowed extensions: ${constraints.extensions.join(', ')}`
			};
		}
	}

	return { ok: true, file };
}

export function readFileAsText(file: File): Promise<string> {
	return file.text();
}

export function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ''));
		reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
		reader.readAsDataURL(file);
	});
}
