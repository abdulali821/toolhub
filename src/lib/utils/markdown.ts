export const MARKDOWN_FILE_CONSTRAINTS = {
	maxBytes: 2 * 1024 * 1024,
	accept: '.md,.markdown,text/markdown',
	mimeAllowlist: ['text/markdown', 'text/plain', 'text/x-markdown'],
	extensions: ['.md', '.markdown']
};

export function escapeHtml(text: string) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function inline(text: string) {
	return escapeHtml(text)
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
}

/** Lightweight Markdown subset — no dependency, good enough for previews. */
export function markdownToHtml(markdown: string): string {
	const lines = markdown.replace(/\r\n/g, '\n').split('\n');
	const html: string[] = [];
	let inCode = false;
	let codeLang = '';
	let codeLines: string[] = [];
	let inList = false;

	const closeList = () => {
		if (inList) {
			html.push('</ul>');
			inList = false;
		}
	};

	const flushCode = () => {
		const content = codeLines.join('\n');
		if (codeLang === 'mermaid') {
			html.push(`<pre class="mermaid">${escapeHtml(content)}</pre>`);
		} else {
			html.push(`<pre><code>${codeLines.map(escapeHtml).join('\n')}</code></pre>`);
		}
		codeLines = [];
		codeLang = '';
	};

	for (const raw of lines) {
		if (raw.startsWith('```')) {
			closeList();
			if (inCode) {
				flushCode();
				inCode = false;
			} else {
				codeLang = raw.slice(3).trim().toLowerCase();
				codeLines = [];
				inCode = true;
			}
			continue;
		}

		if (inCode) {
			codeLines.push(raw);
			continue;
		}

		if (/^\s*[-*]\s+/.test(raw)) {
			if (!inList) {
				html.push('<ul>');
				inList = true;
			}
			const item = raw.replace(/^\s*[-*]\s+/, '');
			html.push(`<li>${inline(item)}</li>`);
			continue;
		}

		closeList();

		if (/^###\s+/.test(raw)) html.push(`<h3>${inline(raw.slice(4))}</h3>`);
		else if (/^##\s+/.test(raw)) html.push(`<h2>${inline(raw.slice(3))}</h2>`);
		else if (/^#\s+/.test(raw)) html.push(`<h1>${inline(raw.slice(2))}</h1>`);
		else if (/^>\s+/.test(raw)) html.push(`<blockquote>${inline(raw.slice(2))}</blockquote>`);
		else if (raw.trim() === '') html.push('');
		else html.push(`<p>${inline(raw)}</p>`);
	}

	closeList();
	if (inCode) flushCode();

	return html.filter(Boolean).join('\n');
}
