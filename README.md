# line-ending-count-reporter-ts

Counts CRLF, LF, and bare CR occurrences in a byte buffer so you can tell whether a file is uniform or mixed.

```js
import { countLineEndings, summarizeLineEndings } from 'line-ending-count-reporter-ts';

const bytes = new TextEncoder().encode('a\r\nb\nc\rd');
const counts = countLineEndings(bytes);
// { crlf: 1, lf: 1, cr: 1 }

summarizeLineEndings(counts);
// 'mixed'
```

## Why this exists

A file with mixed line endings is a real defect: it breaks patches, diffs, and some parsers, but it is invisible in most editors. The usual fix is to normalise the file, but before you can normalise you have to know what is actually there. This library answers that question with a single pass over the raw bytes.

The trade-off is that it works on bytes, not strings. Decoding to a string first would let the runtime collapse or reinterpret line endings, which is exactly the information you are trying to measure. You hand it a `Uint8Array`, `ArrayBuffer`, or `Buffer`, and you get counts back.

## The awkward edge

A CR immediately followed by LF is one CRLF, not a CR plus an LF. That means the LF of a CRLF pair is deliberately not counted in the `lf` field. If you add `crlf + lf + cr` expecting the total number of line breaks, this is the convention you are agreeing to: `crlf` already accounts for its own LF.

A CR at the very end of the buffer is a bare CR, because there is no following byte that could make it a pair.

## API

### `countLineEndings(input)`

`input` is a `Uint8Array`, `ArrayBuffer`, or `Buffer`. Returns `{ crlf, lf, cr }`, all non-negative integers. Throws `TypeError` for anything else, including `null`.

### `summarizeLineEndings(counts)`

Takes the object returned by `countLineEndings` and returns one of `'crlf'`, `'lf'`, `'cr'`, `'mixed'`, or `'none'`. A file is `'mixed'` when more than one of the three counts is non-zero. A file with no line endings at all is `'none'`. Throws `TypeError` if any count is not a non-negative integer.
