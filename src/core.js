const CR = 0x0d;
const LF = 0x0a;

/**
 * Counts CRLF, LF, and bare CR occurrences in a byte buffer.
 *
 * We scan bytes rather than decoding to a string because line endings are
 * byte-level concerns. Decoding first would collapse encodings and could turn
 * a lone CR into a replacement character, hiding the very thing we are
 * measuring. The scan is a single pass and never allocates.
 *
 * A CR immediately followed by LF is counted as one CRLF, not as a CR plus an
 * LF. Every other LF is a lone LF, and every other CR is a bare CR. This is
 * the only unambiguous interpretation: it matches how editors and version
 * control systems report mixed endings.
 *
 * @param {Uint8Array | ArrayBuffer | Buffer} input
 * @returns {{ crlf: number, lf: number, cr: number }}
 */
export function countLineEndings(input) {
  if (input == null) {
    throw new TypeError('countLineEndings requires a Uint8Array, ArrayBuffer, or Buffer');
  }

  let bytes;
  if (input instanceof Uint8Array) {
    bytes = input;
  } else if (input instanceof ArrayBuffer) {
    bytes = new Uint8Array(input);
  } else {
    throw new TypeError('countLineEndings requires a Uint8Array, ArrayBuffer, or Buffer');
  }

  let crlf = 0;
  let lf = 0;
  let cr = 0;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === CR) {
      if (i + 1 < bytes.length && bytes[i + 1] === LF) {
        crlf++;
        i++; // consume the LF so it is not also counted as a lone LF
      } else {
        cr++;
      }
    } else if (b === LF) {
      lf++;
    }
  }

  return { crlf, lf, cr };
}

/**
 * Classifies the line-ending style of a buffer from its counts.
 *
 * The classification is deliberately coarse. A file is "mixed" when more than
 * one of the three categories is non-zero, because that is the condition a
 * caller almost always wants to detect. A file with no line endings at all is
 * reported as "none" rather than guessed at, since there is nothing to guess
 * from.
 *
 * @param {{ crlf: number, lf: number, cr: number }} counts
 * @returns {'crlf' | 'lf' | 'cr' | 'mixed' | 'none'}
 */
export function summarizeLineEndings(counts) {
  if (counts == null || typeof counts !== 'object') {
    throw new TypeError('summarizeLineEndings requires a counts object');
  }

  const { crlf, lf, cr } = counts;
  for (const [name, value] of [['crlf', crlf], ['lf', lf], ['cr', cr]]) {
    if (!Number.isInteger(value) || value < 0) {
      throw new TypeError(`summarizeLineEndings: ${name} must be a non-negative integer`);
    }
  }

  const present = (crlf > 0 ? 1 : 0) + (lf > 0 ? 1 : 0) + (cr > 0 ? 1 : 0);
  if (present === 0) return 'none';
  if (present > 1) return 'mixed';
  if (crlf > 0) return 'crlf';
  if (lf > 0) return 'lf';
  return 'cr';
}
