import test from 'node:test';
import assert from 'node:assert/strict';
import { isTextSubtitle } from '../src/language.js';

test('accepts subtitle formats Stremio can render as text', () => {
  for (const format of ['Subrip(srt)', 'ASS/SSA', 'WebVTT']) assert.equal(isTextSubtitle(format), true);
});

test('rejects image and binary subtitle formats', () => {
  for (const format of ['VobSub', 'SUP', 'PGS']) assert.equal(isTextSubtitle(format), false);
});
