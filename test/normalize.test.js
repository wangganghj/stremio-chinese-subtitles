import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeToSrt, formatSrtTime, parseTimestamp, cleanSubtitleText } from '../src/normalize.js';

test('formatSrtTime formats milliseconds accurately', () => {
  assert.equal(formatSrtTime(0), '00:00:00,000');
  assert.equal(formatSrtTime(1234), '00:00:01,234');
  assert.equal(formatSrtTime(3661005), '01:01:01,005');
});

test('parseTimestamp parses various formats', () => {
  assert.equal(parseTimestamp('00:01:02,300'), 62300);
  assert.equal(parseTimestamp('00:01:02.300'), 62300);
  assert.equal(parseTimestamp('1:02.30'), 62300);
  assert.equal(parseTimestamp('0:01:02.30'), 62300);
});

test('cleanSubtitleText strips ASS tags, HTML, and extra newlines', () => {
  const dirty = '{\\pos(100,200)\\c&H00FFFF&}Hello\\NWorld<font color="red">!</font>\n\n...\nSecond line';
  assert.equal(cleanSubtitleText(dirty), 'Hello\nWorld!\nSecond line');
});

test('converts Aegisub ASS to valid sequential SRT', () => {
  const ass = `[Script Info]
Title: Sample
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:01:14.36,0:01:16.82,Default,,0,0,0,,{\\pos(960,1000)}你好，世界！\\NHello World
Dialogue: 0,0:01:18.10,0:01:20.50,Default,,0,0,0,,第二行字幕
Comment: 0,0:00:00.00,0:00:00.00,Default,,0,0,0,,注释忽略
`;

  const srt = normalizeToSrt(ass, 'ass');
  assert.equal(srt.trim(), `1
00:01:14,360 --> 00:01:16,820
你好，世界！
Hello World

2
00:01:18,100 --> 00:01:20,500
第二行字幕`);
});

test('handles UTF-8 BOM and malformed cue numbers in SRT', () => {
  const bomSrt = `\uFEFF999
00:00:01,000 --> 00:00:04,000
第一条台词

888
00:00:05,000 --> 00:00:08,000
第二条台词
`;

  const normalized = normalizeToSrt(bomSrt, 'srt');
  assert.equal(normalized.trim(), `1
00:00:01,000 --> 00:00:04,000
第一条台词

2
00:00:05,000 --> 00:00:08,000
第二条台词`);
});

test('converts WebVTT to valid SRT', () => {
  const vtt = `WEBVTT
NOTE This is a note

00:01.000 --> 00:04.000 line:0 position:20%
VTT Subtitle

00:05.500 --> 00:09.000
Second VTT Subtitle
`;

  const normalized = normalizeToSrt(vtt, 'vtt');
  assert.equal(normalized.trim(), `1
00:00:01,000 --> 00:00:04,000
VTT Subtitle

2
00:00:05,500 --> 00:00:09,000
Second VTT Subtitle`);
});
