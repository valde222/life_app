import { sharedNote } from './shared-note';

describe('sharedNote (R3)', () => {
  it('makes a link its own title', () => {
    expect(sharedNote({ text: 'https://example.com/article' })).toEqual({
      title: 'https://example.com/article',
      body: '',
      inbox: true,
    });
  });

  it('uses the subject as the title and keeps the text', () => {
    expect(sharedNote({ subject: 'Ikea shelf', text: 'https://ikea.com/x' })).toEqual({
      title: 'Ikea shelf',
      body: 'https://ikea.com/x',
      inbox: true,
    });
  });

  it('cuts long text into a title and keeps all of it in the body', () => {
    const long = 'a'.repeat(120);
    const note = sharedNote({ text: long })!;
    expect(note.title?.endsWith('…')).toBe(true);
    expect(note.body).toBe(long);
  });

  it('names photos without text', () => {
    expect(sharedNote({ images: [{ mimeType: 'image/jpeg', base64: '' }] })?.title).toBe('Photo');
  });

  it('ignores an empty share', () => {
    expect(sharedNote({ text: '  ' })).toBeNull();
  });
});
