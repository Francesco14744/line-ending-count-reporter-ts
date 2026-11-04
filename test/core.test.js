import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countLineEndings, summarizeLineEndings } from '../src/index.js';

const bytes = (...values) => Uint8Array.from(values);
const ascii = (s) => new TextEncoder().encode(s);

test('counts a pure LF file', () => {
  assert.deepEqual(countLineEndings(ascii('a\nb\nc\n')), { crlf: 0, lf: 3, cr: 0 });
});

test('counts a pure CRLF file', () => {
  assert.deepEqual(countLineEndings(ascii('a\r\nb\r\n')), { crlf: 2, lf: 0, cr: 0 });
});

test('counts a pure CR file', () => {
  assert.deepEqual(countLineEndings(ascii('a\rb\rc')), { crlf: 0, lf: 0, cr: 2 });
});

test('does not double-count the LF of a CRLF pair', () => {
  // The CR is consumed together with its LF, so the LF count stays zero.
  assert.deepEqual(countLineEndings(bytes(0x0d, 0x0a, 0x0a)), { crlf: 1, lf: 1, cr: 0 });
});

test('counts a CR at end of buffer as bare CR', () => {
  // There is no following byte, so this cannot be a CRLF.
  assert.deepEqual(countLineEndings(bytes(0x61, 0x0d)), { crlf: 0, lf: 0, cr: 1 });
});

test('counts a CR followed by a non-LF byte as bare CR', () => {
  assert.deepEqual(countLineEndings(bytes(0x0d, 0x61)), { crlf: 0, lf: 0, cr: 1 });
});

test('reports mixed endings', () => {
  assert.deepEqual(countLineEndings(ascii('a\r\nb\nc\rd')), { crlf: 1, lf: 1, cr: 1 });
});

test('accepts an ArrayBuffer', () => {
  const buf = ascii('x\r\ny').buffer;
  assert.deepEqual(countLineEndings(buf), { crlf: 1, lf: 0, cr: 0 });
});

test('accepts a Buffer', () => {
  const buf = Buffer.from('x\ny\r\n');
  assert.deepEqual(countLineEndings(buf), { crlf: 1, lf: 1, cr: 0 });
});

test('empty input has no endings', () => {
  assert.deepEqual(countLineEndings(bytes()), { crlf: 0, lf: 0, cr: 0 });
});

test('rejects null input', () => {
  assert.throws(() => countLineEndings(null), TypeError);
});

test('rejects unsupported input types', () => {
  assert.throws(() => countLineEndings('a\n'), TypeError);
});

test('summarizes each pure style', () => {
  assert.equal(summarizeLineEndings({ crlf: 3, lf: 0, cr: 0 }), 'crlf');
  assert.equal(summarizeLineEndings({ crlf: 0, lf: 3, cr: 0 }), 'lf');
  assert.equal(summarizeLineEndings({ crlf: 0, lf: 0, cr: 3 }), 'cr');
});

test('summarizes mixed and empty', () => {
  assert.equal(summarizeLineEndings({ crlf: 1, lf: 1, cr: 0 }), 'mixed');
  assert.equal(summarizeLineEndings({ crlf: 0, lf: 0, cr: 0 }), 'none');
});

test('summary rejects malformed counts', () => {
  assert.throws(() => summarizeLineEndings({ crlf: -1, lf: 0, cr: 0 }), TypeError);
  assert.throws(() => summarizeLineEndings({ crlf: 1.5, lf: 0, cr: 0 }), TypeError);
  assert.throws(() => summarizeLineEndings(null), TypeError);
});
