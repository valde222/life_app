import { withCode, withHeading } from './markdown-edits';

describe('markdown toolbar edits', () => {
  it('turns the current line into a heading', () => {
    expect(withHeading('one\ntwo', { start: 6, end: 6 })).toEqual({
      text: 'one\n## two',
      cursor: 9,
    });
  });

  it('wraps a word in backticks and several lines in a fence', () => {
    expect(withCode('say hi', { start: 4, end: 6 })).toEqual({ text: 'say `hi`', cursor: 8 });
    expect(withCode('say ', { start: 4, end: 4 })).toEqual({ text: 'say ``', cursor: 5 });
    expect(withCode('a\nb', { start: 0, end: 3 })).toEqual({
      text: '\n```\na\nb\n```\n',
      cursor: 13,
    });
  });
});
