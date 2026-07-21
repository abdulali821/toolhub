/**
 * Encoding helpers shared by the encoders cluster.
 */

export function textToAsciiCodes(text: string, separator = ' '): string {
	return [...text].map((ch) => ch.codePointAt(0) ?? 0).join(separator);
}

export function asciiCodesToText(codes: string): string {
	const parts = codes
		.trim()
		.split(/[\s,;]+/)
		.filter(Boolean);
	if (!parts.length) return '';
	return parts
		.map((part) => {
			const n = Number(part);
			if (!Number.isInteger(n) || n < 0 || n > 0x10ffff) {
				throw new Error(`Invalid code point: ${part}`);
			}
			return String.fromCodePoint(n);
		})
		.join('');
}

export function textToBinary(text: string, separator = ' '): string {
	const bytes = new TextEncoder().encode(text);
	return [...bytes].map((b) => b.toString(2).padStart(8, '0')).join(separator);
}

export function binaryToText(binary: string): string {
	const bits = binary
		.trim()
		.replace(/\s+/g, ' ')
		.split(/[\s,]+/)
		.filter(Boolean);
	if (!bits.length) return '';
	const bytes = bits.map((chunk) => {
		if (!/^[01]+$/.test(chunk)) throw new Error(`Invalid binary: ${chunk}`);
		const n = parseInt(chunk, 2);
		if (n > 255) throw new Error(`Binary byte out of range: ${chunk}`);
		return n;
	});
	return new TextDecoder().decode(Uint8Array.from(bytes));
}

export function textToHex(text: string, separator = ' '): string {
	const bytes = new TextEncoder().encode(text);
	return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join(separator);
}

export function hexToText(hex: string): string {
	const cleaned = hex
		.trim()
		.replace(/^0x/i, '')
		.replace(/[\s,:_-]+/g, '');
	if (!cleaned) return '';
	if (cleaned.length % 2 !== 0) throw new Error('Hex string must have an even length');
	if (!/^[0-9a-f]+$/i.test(cleaned)) throw new Error('Invalid hex characters');
	const bytes = new Uint8Array(cleaned.length / 2);
	for (let i = 0; i < cleaned.length; i += 2) {
		bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16);
	}
	return new TextDecoder().decode(bytes);
}

export function escapeUnicode(text: string, mode: 'js' | 'css' = 'js'): string {
	return [...text]
		.map((ch) => {
			const cp = ch.codePointAt(0)!;
			if (cp <= 0x7f && ch !== '\\' && ch !== '"') return ch;
			if (mode === 'css') return `\\${cp.toString(16).padStart(cp > 0xffff ? 6 : 4, '0')} `;
			if (cp <= 0xffff) return `\\u${cp.toString(16).padStart(4, '0')}`;
			const offset = cp - 0x10000;
			const high = 0xd800 + (offset >> 10);
			const low = 0xdc00 + (offset & 0x3ff);
			return `\\u${high.toString(16).padStart(4, '0')}\\u${low.toString(16).padStart(4, '0')}`;
		})
		.join('');
}

export function unescapeUnicode(text: string): string {
	return text
		.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
		.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
		.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
		.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex: string) =>
			String.fromCodePoint(parseInt(hex, 16))
		);
}

export function rot13(text: string): string {
	return text.replace(/[a-zA-Z]/g, (ch) => {
		const base = ch <= 'Z' ? 65 : 97;
		return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base);
	});
}

const MORSE_MAP: Record<string, string> = {
	A: '.-',
	B: '-...',
	C: '-.-.',
	D: '-..',
	E: '.',
	F: '..-.',
	G: '--.',
	H: '....',
	I: '..',
	J: '.---',
	K: '-.-',
	L: '.-..',
	M: '--',
	N: '-.',
	O: '---',
	P: '.--.',
	Q: '--.-',
	R: '.-.',
	S: '...',
	T: '-',
	U: '..-',
	V: '...-',
	W: '.--',
	X: '-..-',
	Y: '-.--',
	Z: '--..',
	'0': '-----',
	'1': '.----',
	'2': '..---',
	'3': '...--',
	'4': '....-',
	'5': '.....',
	'6': '-....',
	'7': '--...',
	'8': '---..',
	'9': '----.',
	'.': '.-.-.-',
	',': '--..--',
	'?': '..--..',
	"'": '.----.',
	'!': '-.-.--',
	'/': '-..-.',
	'(': '-.--.',
	')': '-.--.-',
	'&': '.-...',
	':': '---...',
	';': '-.-.-.',
	'=': '-...-',
	'+': '.-.-.',
	'-': '-....-',
	_: '..--.-',
	'"': '.-..-.',
	$: '...-..-',
	'@': '.--.-.',
	' ': '/'
};

const MORSE_REVERSE = Object.fromEntries(
	Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
) as Record<string, string>;

export function encodeMorse(text: string): string {
	return text
		.toUpperCase()
		.split('')
		.map((ch) => {
			const code = MORSE_MAP[ch];
			if (!code && ch !== ' ') throw new Error(`Unsupported character for Morse: ${ch}`);
			return code ?? '/';
		})
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function decodeMorse(morse: string): string {
	const tokens = morse.trim().split(/\s+/).filter(Boolean);
	return tokens
		.map((token) => {
			if (token === '/' || token === '|') return ' ';
			const ch = MORSE_REVERSE[token];
			if (!ch) throw new Error(`Unknown Morse sequence: ${token}`);
			return ch;
		})
		.join('')
		.replace(/ +/g, ' ');
}
