let previewInitialized = false;
let lastTheme: 'light' | 'dark' | null = null;

const BATCH_TIMEOUT_MS = 12_000;
const PNG_TIMEOUT_MS = 5_000;
const MAX_RASTER_WIDTH = 1_200;

/** Hidden but laid-out — off-screen/opacity:0 breaks Mermaid layout. */
const HIDDEN_HOST_STYLE =
	'position:fixed;top:0;left:0;width:900px;visibility:hidden;pointer-events:none;z-index:-1;';

function currentTheme(): 'light' | 'dark' {
	if (typeof document === 'undefined') return 'light';
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) => {
			window.setTimeout(() => reject(new Error(message)), ms);
		})
	]);
}

async function getMermaid(mode: 'preview' | 'pdf') {
	const mermaid = (await import('mermaid')).default;

	if (mode === 'pdf') {
		mermaid.initialize({
			startOnLoad: false,
			theme: 'neutral',
			securityLevel: 'strict',
			fontSize: 14
		});
		return mermaid;
	}

	const theme = currentTheme() === 'dark' ? 'dark' : 'neutral';
	if (!previewInitialized || lastTheme !== currentTheme()) {
		mermaid.initialize({
			startOnLoad: false,
			theme,
			securityLevel: 'strict'
		});
		previewInitialized = true;
		lastTheme = currentTheme();
	}

	return mermaid;
}

export type MermaidRaster = { png: Uint8Array; width: number; height: number };

function parseSvgSize(svgEl: SVGSVGElement): { width: number; height: number } {
	const viewBox = svgEl.viewBox.baseVal;
	if (viewBox.width > 0 && viewBox.height > 0) {
		return { width: Math.ceil(viewBox.width), height: Math.ceil(viewBox.height) };
	}

	const width = parseFloat((svgEl.getAttribute('width') ?? '').replace(/[^\d.]/g, ''));
	const height = parseFloat((svgEl.getAttribute('height') ?? '').replace(/[^\d.]/g, ''));

	if (width > 0 && height > 0) {
		return { width: Math.ceil(width), height: Math.ceil(height) };
	}

	try {
		const bbox = svgEl.getBBox();
		if (bbox.width > 0 && bbox.height > 0) {
			return { width: Math.ceil(bbox.width), height: Math.ceil(bbox.height) };
		}
	} catch {
		// getBBox can fail if SVG is not attached.
	}

	return { width: 800, height: 600 };
}

function capRasterSize(width: number, height: number) {
	if (width <= MAX_RASTER_WIDTH) return { width, height };
	const scale = MAX_RASTER_WIDTH / width;
	return { width: MAX_RASTER_WIDTH, height: Math.max(1, Math.ceil(height * scale)) };
}

function svgElementToPng(svgEl: SVGSVGElement): Promise<MermaidRaster> {
	return withTimeout(
		new Promise((resolve, reject) => {
			let { width, height } = parseSvgSize(svgEl);
			({ width, height } = capRasterSize(width, height));

			svgEl.setAttribute('width', String(width));
			svgEl.setAttribute('height', String(height));
			if (!svgEl.getAttribute('xmlns')) {
				svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			}

			const serialized = new XMLSerializer().serializeToString(svgEl);
			const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
			const img = new Image();

			img.onload = () => {
				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Canvas unavailable'));
					return;
				}

				ctx.fillStyle = '#ffffff';
				ctx.fillRect(0, 0, width, height);
				ctx.drawImage(img, 0, 0, width, height);

				canvas.toBlob(
					async (pngBlob) => {
						if (!pngBlob) {
							reject(new Error('PNG export failed'));
							return;
						}
						resolve({
							png: new Uint8Array(await pngBlob.arrayBuffer()),
							width,
							height
						});
					},
					'image/png',
					0.92
				);
			};

			img.onerror = () => reject(new Error('Failed to load Mermaid SVG'));
			img.src = dataUrl;
		}),
		PNG_TIMEOUT_MS,
		'Mermaid PNG export timed out'
	);
}

/** Rasterize multiple Mermaid diagrams in one pass. Browser only. */
export async function renderMermaidBatchToPng(
	sources: string[]
): Promise<(MermaidRaster | null)[]> {
	if (!sources.length) return [];
	if (typeof document === 'undefined') return sources.map(() => null);

	const host = document.createElement('div');
	host.style.cssText = HIDDEN_HOST_STYLE;

	const nodes = sources.map((source) => {
		const node = document.createElement('pre');
		node.className = 'mermaid';
		node.textContent = source.trim();
		host.appendChild(node);
		return node;
	});

	document.body.appendChild(host);

	try {
		const mermaid = await getMermaid('pdf');
		await withTimeout(mermaid.run({ nodes }), BATCH_TIMEOUT_MS, 'Mermaid batch timed out');

		return Promise.all(
			nodes.map(async (node) => {
				try {
					const svgEl = node.querySelector('svg');
					if (!svgEl) return null;
					return await svgElementToPng(svgEl);
				} catch {
					return null;
				}
			})
		);
	} catch {
		return sources.map(() => null);
	} finally {
		host.remove();
	}
}

/** Rasterize a single Mermaid diagram to PNG for PDF embedding. Browser only. */
export async function renderMermaidToPng(source: string): Promise<MermaidRaster> {
	const [result] = await renderMermaidBatchToPng([source]);
	if (!result) throw new Error('Mermaid diagram failed to render');
	return result;
}

/** Render Mermaid diagrams inside a container after HTML is injected. */
export async function renderMermaidIn(container: HTMLElement) {
	const nodes = container.querySelectorAll<HTMLElement>('.mermaid');
	if (!nodes.length) return;

	const mermaid = await getMermaid('preview');
	await mermaid.run({ nodes });
}
