import { describe, expect, it } from 'vitest';
import {
	asciiCodesToText,
	binaryToText,
	decodeMorse,
	encodeMorse,
	escapeUnicode,
	hexToText,
	rot13,
	textToAsciiCodes,
	textToBinary,
	textToHex,
	unescapeUnicode
} from '../../src/lib/utils/encoding';

describe('encoding utils', () => {
	it('textToAsciiCodes and asciiCodesToText round-trip', () => {
		expect(textToAsciiCodes('Hi')).toBe('72 105');
		expect(asciiCodesToText('72 105')).toBe('Hi');
		expect(asciiCodesToText('72,105;108')).toBe('Hil');
	});

	it('rejects invalid ascii code points', () => {
		expect(() => asciiCodesToText('9999999')).toThrow(/Invalid code point/);
	});

	it('textToBinary and binaryToText round-trip UTF-8', () => {
		const binary = textToBinary('Hi');
		expect(binary).toBe('01001000 01101001');
		expect(binaryToText(binary)).toBe('Hi');
	});

	it('rejects invalid binary chunks', () => {
		expect(() => binaryToText('102')).toThrow(/Invalid binary/);
	});

	it('textToHex and hexToText round-trip', () => {
		expect(textToHex('Hi')).toBe('48 69');
		expect(hexToText('48 69')).toBe('Hi');
		expect(hexToText('0x48656c6c6f')).toBe('Hello');
	});

	it('rejects odd-length hex', () => {
		expect(() => hexToText('abc')).toThrow(/even length/);
	});

	it('escapeUnicode and unescapeUnicode round-trip', () => {
		const escaped = escapeUnicode('café');
		expect(escaped).toContain('\\u');
		expect(unescapeUnicode(escaped)).toBe('café');
	});

	it('rot13 is self-inverse for letters', () => {
		expect(rot13('Hello')).toBe('Uryyb');
		expect(rot13('Uryyb')).toBe('Hello');
		expect(rot13('ToolHub123')).toBe('GbbyUho123');
	});

	it('encodeMorse and decodeMorse round-trip', () => {
		const morse = encodeMorse('SOS');
		expect(morse).toBe('... --- ...');
		expect(decodeMorse(morse)).toBe('SOS');
		expect(decodeMorse('.... . .-.. .-.. ---')).toBe('HELLO');
	});
});
