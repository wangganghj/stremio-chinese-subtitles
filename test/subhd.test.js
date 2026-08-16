import test from 'node:test';
import assert from 'node:assert/strict';
import { previewToSrt } from '../src/sources/subhd.js';

test('converts SubHD preview timestamps to valid SRT cues', () => {
  assert.equal(previewToSrt('[00:00:01]\n第一行\n\n[00:00:03.5]\nSecond'),
    '1\n00:00:01,000 --> 00:00:03,400\n第一行\n\n2\n00:00:03,500 --> 00:00:08,500\nSecond');
});

test('does not leave a cue visible throughout a long silent gap', () => {
  assert.equal(previewToSrt('[00:00:10]\n短句\n\n[00:00:30]\n下一句').split('\n\n')[0],
    '1\n00:00:10,000 --> 00:00:16,000\n短句');
});
