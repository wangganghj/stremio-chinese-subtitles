import test from 'node:test';
import assert from 'node:assert/strict';
import { parseExtra, queryFromRequest } from '../src/query.js';

test('extracts a useful query from a release filename', () => {
  assert.equal(queryFromRequest('tt0903747:5:14', { filename: 'Breaking.Bad.S05E14.1080p.BluRay.x264.mkv' }), 'Breaking Bad S05E14');
});

test('parses Stremio semicolon extras', () => {
  assert.deepEqual(parseExtra('filename=The.Bear.S03E01.mkv;videoSize=1.json'), { filename: 'The.Bear.S03E01.mkv', videoSize: '1' });
});

test('prefers Stremio videoID when the route id is a video hash', () => {
  assert.equal(queryFromRequest('0123456789abcdef', { videoID: 'tt0903747:5:14' }), 'tt0903747 S05E14');
});

test('accepts the videoId casing used by newer clients', () => {
  assert.equal(queryFromRequest('0123456789abcdef', { videoId: 'tt1375666' }), 'tt1375666');
});
