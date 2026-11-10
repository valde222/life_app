import { OpenError } from '../../core/platform/file-opener';
import { openFailedTitle, refusedTitle } from './note-file-list';

describe('note file list', () => {
  it('names the file that is too big, or counts them (R31)', () => {
    expect(refusedTitle(['film.mp4'])).toBe('film.mp4 is over 50 MB');
    expect(refusedTitle(['a.mp4', 'b.mp4'])).toBe('2 files are over 50 MB');
  });

  it('says why a file did not open', () => {
    expect(openFailedTitle('a.pdf', new Error('x'), false)).toBe("a.pdf opens when you're online");
    expect(openFailedTitle('a.xyz', new OpenError('no-app'), true)).toBe('No app here opens a.xyz');
    expect(openFailedTitle('a.pdf', new OpenError('failed'), true)).toBe("Couldn't open a.pdf");
  });
});
